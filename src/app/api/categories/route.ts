import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.produceCategory.findMany({
    where: { active: true },
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

const schema = z.object({ family: z.string().min(1), name: z.string().min(1), variety: z.string().optional(), defaultUnit: z.string().default("kg") });

// Produce taxonomy is admin-managed and extensible, per the product spec —
// new products can be added here without touching code.
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const category = await prisma.produceCategory.create({ data: parsed.data });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
