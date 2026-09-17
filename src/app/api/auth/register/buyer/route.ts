import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const demandItemSchema = z.object({
  produceCategoryId: z.string(),
  typicalQuantity: z.number().positive(),
  unit: z.string().default("kg"),
  frequency: z.string(),
});

const schema = z.object({
  // Operator
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
  position: z.string().optional(),
  preferredLanguage: z.string().default("en"),

  // Business
  businessName: z.string().min(1),
  crNumber: z.string().optional(),
  crDocumentUrl: z.string().optional(),
  buyerType: z.string().min(1),
  businessPhone: z.string().optional(),
  businessEmail: z.string().optional(),

  // Location — governorate/caza/city/street + exact coordinates
  governorate: z.string().min(1),
  caza: z.string().optional(),
  city: z.string().min(1),
  street: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  businessPhotoUrl: z.string().optional(),

  demandProfile: z.array(demandItemSchema).default([]),
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
      position: data.position,
      preferredLanguage: data.preferredLanguage,
      buyerProfile: {
        create: {
          businessName: data.businessName,
          buyerType: data.buyerType,
          contactPerson: `${data.firstName} ${data.lastName}`,
          crNumber: data.crNumber,
          crDocumentUrl: data.crDocumentUrl,
          governorate: data.governorate,
          caza: data.caza,
          city: data.city,
          street: data.street,
          latitude: data.latitude,
          longitude: data.longitude,
          businessPhone: data.businessPhone,
          businessEmail: data.businessEmail,
          profileCompletionPct: data.crDocumentUrl ? 85 : 65,
          photos: data.businessPhotoUrl ? { create: [{ url: data.businessPhotoUrl, category: "storefront" }] } : undefined,
          deliveryLocations: {
            create: [
              {
                label: `${data.businessName} — main location`,
                address: [data.street, data.city, data.caza, data.governorate].filter(Boolean).join(", "),
                latitude: data.latitude,
                longitude: data.longitude,
                isPrimary: true,
              },
            ],
          },
          demandProfile: {
            create: data.demandProfile.map((d) => ({
              produceCategoryId: d.produceCategoryId,
              typicalQuantity: d.typicalQuantity,
              unit: d.unit,
              frequency: d.frequency,
            })),
          },
        },
      },
    },
    include: { buyerProfile: true },
  });

  await createSession({ userId: user.id, role: "BUYER" });

  return NextResponse.json({ ok: true, userId: user.id });
}
