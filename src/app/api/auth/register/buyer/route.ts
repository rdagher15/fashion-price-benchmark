import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
  preferredLanguage: z.string().default("en"),

  businessName: z.string().min(1),
  buyerType: z.string().min(1),
  contactPerson: z.string().optional(),
  businessRegistrationInfo: z.string().optional(),
  region: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  deliveryLocations: z
    .array(
      z.object({
        label: z.string(),
        address: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        isPrimary: z.boolean().default(false),
      })
    )
    .default([]),
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
      role: "BUYER",
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.mobile,
      email: data.email,
      passwordHash,
      preferredLanguage: data.preferredLanguage,
      buyerProfile: {
        create: {
          businessName: data.businessName,
          buyerType: data.buyerType,
          contactPerson: data.contactPerson,
          businessRegistrationInfo: data.businessRegistrationInfo,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          profileCompletionPct: 70,
          deliveryLocations: {
            create: data.deliveryLocations.length
              ? data.deliveryLocations
              : [{ label: "Primary location", address: `${data.city}, ${data.region}`, latitude: data.latitude, longitude: data.longitude, isPrimary: true }],
          },
        },
      },
    },
    include: { buyerProfile: true },
  });

  await createSession({ userId: user.id, role: "BUYER" });

  return NextResponse.json({ ok: true, userId: user.id });
}
