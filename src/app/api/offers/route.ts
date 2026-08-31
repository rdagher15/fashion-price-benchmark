import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { LISTING_STATUS, OFFER_STATUS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const schema = z.object({
  listingId: z.string(),
  requirementId: z.string().optional(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  deliveryDate: z.string(),
  deliveryMethod: z.string(),
  deliveryLocationLabel: z.string().optional(),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  packagingNote: z.string().optional(),
  message: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId") || undefined;
  const offers = await prisma.offer.findMany({
    where: { listingId },
    include: { listing: { include: { produceCategory: true } }, buyerProfile: true, farmerProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId }, include: { produceCategory: true } });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const offer = await prisma.offer.create({
      data: {
        listingId: data.listingId,
        requirementId: data.requirementId,
        buyerProfileId: user.buyerProfile!.id,
        farmerProfileId: listing.farmerProfileId,
        quantity: data.quantity,
        price: data.price,
        priceUnit: listing.priceUnit,
        deliveryDate: new Date(data.deliveryDate),
        deliveryMethod: data.deliveryMethod,
        deliveryLocationLabel: data.deliveryLocationLabel,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        packagingNote: data.packagingNote,
        message: data.message,
        initiatedBy: "BUYER",
        status: OFFER_STATUS.PENDING,
      },
    });

    if (listing.status === LISTING_STATUS.PUBLISHED) {
      await prisma.listing.update({ where: { id: listing.id }, data: { status: LISTING_STATUS.OFFERS_RECEIVED } });
    }
    if (data.requirementId) {
      await prisma.requirement.update({ where: { id: data.requirementId }, data: { status: "Offer Sent" } }).catch(() => {});
    }

    const farmer = await prisma.farmerProfile.findUnique({ where: { id: listing.farmerProfileId }, include: { user: true } });
    const inRange = data.price >= listing.minPrice && data.price <= (listing.maxPrice ?? listing.preferredPrice ?? listing.minPrice * 999);
    await notify(
      farmer!.userId,
      "OFFER_RECEIVED",
      "New offer received",
      `${user.buyerProfile!.businessName} offered ${formatMoney(data.price)}/${listing.priceUnit} for ${data.quantity} ${listing.unit} of ${listing.produceCategory.name}.${inRange ? " This is within your preferred price range." : ""}`,
      `/farmer/offers/${offer.id}`
    );

    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
  }
}
