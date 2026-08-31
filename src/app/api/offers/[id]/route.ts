import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { anonymizedBuyerLabel } from "@/lib/anonymize";

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

    // Redact the retailer's real identity from the API response itself (not
    // just the rendered page) until an Order exists — see product spec on
    // retailer anonymity.
    if (user.role === "FARMER" && !offer.order) {
      const label = await anonymizedBuyerLabel(offer.buyerProfile);
      (offer as any).buyerProfile = {
        ...offer.buyerProfile,
        businessName: label,
        contactPerson: null,
        crNumber: null,
        crDocumentUrl: null,
        street: null,
        latitude: null,
        longitude: null,
        businessPhone: null,
        businessEmail: null,
      };
    }

    return NextResponse.json({ offer });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to load offer" }, { status: 500 });
  }
}
