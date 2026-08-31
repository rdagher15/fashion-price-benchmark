import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        listing: { include: { produceCategory: true } },
        requirement: true,
        buyerProfile: true,
        farmerProfile: true,
        negotiations: { orderBy: { createdAt: "asc" } },
        order: true,
      },
    });
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParty =
      (user.role === "FARMER" && user.farmerProfile?.id === offer.farmerProfileId) ||
      (user.role === "BUYER" && user.buyerProfile?.id === offer.buyerProfileId);
    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ offer });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to load offer" }, { status: 500 });
  }
}
