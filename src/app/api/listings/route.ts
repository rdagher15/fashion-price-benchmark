import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { generateMatchesForListing } from "@/lib/matching";
import { LISTING_STATUS } from "@/lib/constants";

const schema = z.object({
  produceCategoryId: z.string(),
  variety: z.string().optional(),
  photoUrl: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  minOrderQuantity: z.number().optional(),
  availableFrom: z.string(),
  availableUntil: z.string(),
  readyDate: z.string().optional(),
  grade: z.string().optional(),
  sizeSpec: z.string().optional(),
  qualityLevel: z.string().optional(),
  productionMethod: z.enum(["organic", "conventional"]).default("conventional"),
  certificationNote: z.string().optional(),
  packagingType: z.string().optional(),
  unitsPerPackage: z.number().optional(),
  packageWeight: z.number().optional(),
  deliveryMethods: z.array(z.string()).default(["buyer_pickup"]),
  deliveryRadiusKm: z.number().optional(),
  deliveryCost: z.number().optional(),
  minPrice: z.number().positive(),
  preferredPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  priceUnit: z.string().default("kg"),
  status: z.string().default(LISTING_STATUS.PUBLISHED),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const produceCategoryId = searchParams.get("produceCategoryId") || undefined;
  const status = searchParams.get("status") || undefined;
  const mine = searchParams.get("mine");

  let farmerProfileId: string | undefined;
  if (mine) {
    const user = await requireRole("FARMER");
    farmerProfileId = user.farmerProfile!.id;
  }

  const listings = await prisma.listing.findMany({
    where: {
      produceCategoryId,
      status: status || (mine ? undefined : { notIn: [LISTING_STATUS.DRAFT, LISTING_STATUS.CANCELLED] }),
      farmerProfileId,
    },
    include: { produceCategory: true, farmerProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const listing = await prisma.listing.create({
      data: {
        farmerProfileId: user.farmerProfile!.id,
        produceCategoryId: data.produceCategoryId,
        variety: data.variety,
        photoUrl: data.photoUrl,
        quantity: data.quantity,
        unit: data.unit,
        minOrderQuantity: data.minOrderQuantity,
        availableFrom: new Date(data.availableFrom),
        availableUntil: new Date(data.availableUntil),
        readyDate: data.readyDate ? new Date(data.readyDate) : undefined,
        grade: data.grade,
        sizeSpec: data.sizeSpec,
        qualityLevel: data.qualityLevel,
        productionMethod: data.productionMethod,
        certificationNote: data.certificationNote,
        packagingType: data.packagingType,
        unitsPerPackage: data.unitsPerPackage,
        packageWeight: data.packageWeight,
        deliveryMethodsJson: JSON.stringify(data.deliveryMethods),
        deliveryRadiusKm: data.deliveryRadiusKm,
        deliveryCost: data.deliveryCost,
        minPrice: data.minPrice,
        preferredPrice: data.preferredPrice,
        maxPrice: data.maxPrice,
        priceUnit: data.priceUnit,
        status: data.status,
      },
    });

    if (listing.status !== LISTING_STATUS.DRAFT) {
      await generateMatchesForListing(listing.id);
    }

    return NextResponse.json({ ok: true, listing });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
