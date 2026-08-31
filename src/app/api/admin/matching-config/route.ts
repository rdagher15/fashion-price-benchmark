import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { getMatchingConfig } from "@/lib/matching";

export async function GET() {
  const config = await getMatchingConfig();
  return NextResponse.json({ config });
}

const schema = z.object({
  weightProduce: z.number().min(0),
  weightQuantity: z.number().min(0),
  weightDate: z.number().min(0),
  weightGeo: z.number().min(0),
  weightDelivery: z.number().min(0),
  weightPrice: z.number().min(0),
  maxDistanceKm: z.number().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const config = await prisma.matchingConfig.upsert({
      where: { id: "singleton" },
      update: parsed.data,
      create: { id: "singleton", ...parsed.data },
    });
    return NextResponse.json({ ok: true, config });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to update matching config" }, { status: 500 });
  }
}
