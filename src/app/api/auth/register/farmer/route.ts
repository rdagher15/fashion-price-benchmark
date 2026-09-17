import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const produceItemSchema = z.object({
  produceCategoryId: z.string(),
  typicalQuantity: z.number().optional(),
  unit: z.string().optional(),
  productionFrequency: z.string().optional(),
  productionSeason: z.string().optional(),
});

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
  nationality: z.string().optional(),
  preferredLanguage: z.string().default("en"),

  farmName: z.string().min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  farmSizeValue: z.number().optional(),
  farmSizeUnit: z.string().optional(),
  farmType: z.string().optional(),
  yearsOperating: z.number().optional(),
  numWorkers: z.number().optional(),

  produce: z.array(produceItemSchema).default([]),

  hasOwnVehicle: z.boolean().default(false),
  vehicleType: z.string().optional(),
  vehicleCapacity: z.string().optional(),
  refrigerated: z.boolean().default(false),
  deliveryRadiusKm: z.number().optional(),
  canDeliver: z.boolean().default(false),
  allowPickup: z.boolean().default(true),
  sharedDelivery: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      role: "FARMER",
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.mobile,
      email: data.email,
      passwordHash,
      nationality: data.nationality,
      preferredLanguage: data.preferredLanguage,
      farmerProfile: {
        create: {
          farmName: data.farmName,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          farmSizeValue: data.farmSizeValue,
          farmSizeUnit: data.farmSizeUnit,
          farmType: data.farmType,
          yearsOperating: data.yearsOperating,
          numWorkers: data.numWorkers,
          hasOwnVehicle: data.hasOwnVehicle,
          vehicleType: data.vehicleType,
          vehicleCapacity: data.vehicleCapacity,
          refrigerated: data.refrigerated,
          deliveryRadiusKm: data.deliveryRadiusKm,
          canDeliver: data.canDeliver,
          allowPickup: data.allowPickup,
          sharedDelivery: data.sharedDelivery,
          profileCompletionPct: 55,
          produceItems: {
            create: data.produce.map((p) => ({
              produceCategoryId: p.produceCategoryId,
              typicalQuantity: p.typicalQuantity,
              unit: p.unit,
              productionFrequency: p.productionFrequency,
              productionSeason: p.productionSeason,
            })),
          },
        },
      },
    },
    include: { farmerProfile: true },
  });

  await createSession({ userId: user.id, role: "FARMER" });

  return NextResponse.json({ ok: true, userId: user.id });
}
