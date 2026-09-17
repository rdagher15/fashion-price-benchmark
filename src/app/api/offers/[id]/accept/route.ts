import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { createOrderFromOffer } from "@/lib/orders";
import { OFFER_STATUS } from "@/lib/constants";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const offer = await prisma.offer.findUnique({ where: { id: params.id } });
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParty =
      (user.role === "FARMER" && user.farmerProfile?.id === offer.farmerProfileId) ||
      (user.role === "BUYER" && user.buyerProfile?.id === offer.buyerProfileId);
    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (![OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED].includes(offer.status as any)) {
      return NextResponse.json({ error: "This offer can no longer be accepted." }, { status: 409 });
    }

    const order = await createOrderFromOffer(offer.id);
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to accept offer" }, { status: 500 });
  }
}
