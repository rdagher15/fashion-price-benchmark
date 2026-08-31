import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { generateMatchesForRequirement } from "@/lib/matching";
import { REQUIREMENT_STATUS } from "@/lib/constants";

const schema = z.object({
  produceCategoryId: z.string(),
  quantity: z.number().positive(),
  minQuantity: z.number().optional(),
  maxQuantity: z.number().optional(),
  unit: z.string().default("kg"),
  requiredDate: z.string(),
  recurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  deliveryLocationLabel: z.string().min(1),
  deliveryAddress: z.string().optional(),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  packagingRequirement: z.string().optional(),
  qualityRequirement: z.string().optional(),
  productionRequirement: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  priceUnit: z.string().default("kg"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");
  let buyerProfileId: string | undefined;
  if (mine) {
    const user = await requireRole("BUYER");
    buyerProfileId = user.buyerProfile!.id;
  }
  const requirements = await prisma.requirement.findMany({
    where: { buyerProfileId, status: buyerProfileId ? undefined : REQUIREMENT_STATUS.ACTIVE },
    include: { produceCategory: true, buyerProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requirements });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const requirement = await prisma.requirement.create({
      data: {
        buyerProfileId: user.buyerProfile!.id,
        produceCategoryId: data.produceCategoryId,
        quantity: data.quantity,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        unit: data.unit,
        requiredDate: new Date(data.requiredDate),
        recurring: data.recurring,
        recurringFrequency: data.recurringFrequency,
        deliveryLocationLabel: data.deliveryLocationLabel,
        deliveryAddress: data.deliveryAddress,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        packagingRequirement: data.packagingRequirement,
        qualityRequirement: data.qualityRequirement,
        productionRequirement: data.productionRequirement,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        priceUnit: data.priceUnit,
      },
    });

    await generateMatchesForRequirement(requirement.id);

    return NextResponse.json({ ok: true, requirement });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to create requirement" }, { status: 500 });
  }
}
