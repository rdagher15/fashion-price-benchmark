import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { OFFER_STATUS } from "@/lib/constants";

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

    const body = await req.json().catch(() => ({}));
    await prisma.offer.update({ where: { id: offer.id }, data: { status: OFFER_STATUS.REJECTED } });

    const recipientUserId = isFarmer ? offer.buyerProfile.userId : offer.farmerProfile.userId;
    const rejectorLabel = isFarmer ? offer.farmerProfile.farmName : offer.buyerProfile.businessName;
    await notify(
      recipientUserId,
      "OFFER_REJECTED",
      "Offer declined",
      `${rejectorLabel} declined the offer for ${offer.quantity} ${offer.listing.unit} of ${offer.listing.produceCategory.name}.${body.reason ? ` Reason: ${body.reason}` : ""}`,
      isFarmer ? `/buyer/offers/${offer.id}` : `/farmer/offers/${offer.id}`
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to reject offer" }, { status: 500 });
  }
}
