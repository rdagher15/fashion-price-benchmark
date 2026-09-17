import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { OFFER_STATUS, REQUIREMENT_STATUS, retailerAnonymousLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const schema = z.object({ matchId: z.string() });

// Retailer accepts a recommended match: this creates the "order request" to
// the farmer (an Offer) with a proposed price/quantity computed from both
// sides' ranges. The retailer stays anonymous to the farmer at this stage —
// full identity is only disclosed once the farmer accepts and an Order exists.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("BUYER");
    const requirement = await prisma.requirement.findUnique({ where: { id: params.id } });
    if (!requirement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (requirement.buyerProfileId !== user.buyerProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (requirement.status !== REQUIREMENT_STATUS.ACTIVE && requirement.status !== REQUIREMENT_STATUS.MATCHED) {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 409 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const match = await prisma.match.findUnique({
      where: { id: parsed.data.matchId },
      include: { listing: { include: { produceCategory: true, farmerProfile: { include: { user: true } } } } },
    });
    if (!match || match.requirementId !== requirement.id) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const listing = match.listing;
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { id: user.buyerProfile!.id } });
    const businessType = await prisma.businessType.findUnique({ where: { value: buyerProfile!.buyerType } });

    const quantity = Math.min(requirement.quantity, listing.quantity);
    if (listing.minOrderQuantity && quantity < listing.minOrderQuantity) {
      return NextResponse.json({ error: `This farmer requires a minimum order of ${listing.minOrderQuantity} ${listing.unit}.` }, { status: 409 });
    }

    const farmerHigh = listing.maxPrice ?? listing.preferredPrice ?? listing.minPrice;
    let proposedPrice = listing.preferredPrice ?? (listing.minPrice + farmerHigh) / 2;
    if (requirement.maxPrice != null) proposedPrice = Math.min(proposedPrice, requirement.maxPrice);
    proposedPrice = Math.max(proposedPrice, listing.minPrice);
    proposedPrice = Math.round(proposedPrice * 100) / 100;

    const methods: string[] = JSON.parse(listing.deliveryMethodsJson || "[]");
    const deliveryMethod = methods.includes("farmer_delivery") ? "farmer_delivery" : methods.includes("third_party") ? "third_party" : "buyer_pickup";

    const anonymizedLabel = retailerAnonymousLabel(businessType?.label ?? buyerProfile!.buyerType, buyerProfile!.governorate);

    const offer = await prisma.offer.create({
      data: {
        listingId: listing.id,
        requirementId: requirement.id,
        buyerProfileId: user.buyerProfile!.id,
        farmerProfileId: listing.farmerProfileId,
        quantity,
        price: proposedPrice,
        priceUnit: listing.priceUnit,
        deliveryDate: requirement.requiredDate,
        deliveryMethod,
        deliveryLocationLabel: anonymizedLabel,
        message: `Order request via matching — ${quantity} ${listing.unit} requested, acceptable window ${requirement.dateMin?.toDateString() ?? ""} to ${requirement.dateMax?.toDateString() ?? ""}.`,
        initiatedBy: "BUYER",
        status: OFFER_STATUS.PENDING,
      },
    });

    await prisma.requirement.update({ where: { id: requirement.id }, data: { status: REQUIREMENT_STATUS.OFFER_SENT } });
    await prisma.match.update({ where: { id: match.id }, data: { status: "OFFERED" } });

    await notify(
      listing.farmerProfile.userId,
      "OFFER_RECEIVED",
      "New order request",
      `${anonymizedLabel} requests ${quantity} ${listing.unit} of ${listing.produceCategory.name} at ${formatMoney(proposedPrice)}/${listing.priceUnit}, delivery ${requirement.requiredDate.toDateString()}.`,
      `/farmer/offers/${offer.id}`
    );

    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to accept match" }, { status: 500 });
  }
}
