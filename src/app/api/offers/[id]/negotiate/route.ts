import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { OFFER_STATUS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const schema = z.object({
  price: z.number().positive(),
  quantity: z.number().positive(),
  rationale: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: { buyerProfile: { include: { user: true } }, farmerProfile: { include: { user: true } }, listing: { include: { produceCategory: true } } },
    });
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isFarmer = user.role === "FARMER" && user.farmerProfile?.id === offer.farmerProfileId;
    const isBuyer = user.role === "BUYER" && user.buyerProfile?.id === offer.buyerProfileId;
    if (!isFarmer && !isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (![OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED].includes(offer.status as any)) {
      return NextResponse.json({ error: "This offer is no longer open for negotiation." }, { status: 409 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const sender = isFarmer ? "FARMER" : "BUYER";

    await prisma.negotiation.create({
      data: { offerId: offer.id, sender, price: data.price, quantity: data.quantity, rationale: data.rationale },
    });
    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: OFFER_STATUS.COUNTERED, price: data.price, quantity: data.quantity },
    });

    const recipientUserId = isFarmer ? offer.buyerProfile.userId : offer.farmerProfile.userId;
    const senderLabel = isFarmer ? offer.farmerProfile.farmName : offer.buyerProfile.businessName;
    await notify(
      recipientUserId,
      "COUNTER_OFFER",
      "Counter-offer received",
      `${senderLabel} countered with ${formatMoney(data.price)}/${offer.priceUnit} for ${data.quantity} ${offer.listing.unit} of ${offer.listing.produceCategory.name}.`,
      isFarmer ? `/buyer/offers/${offer.id}` : `/farmer/offers/${offer.id}`
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to submit counter-offer" }, { status: 500 });
  }
}
