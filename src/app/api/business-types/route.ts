import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

export async function GET() {
  const types = await prisma.businessType.findMany({ where: { active: true }, orderBy: { label: "asc" } });
  return NextResponse.json({ types });
}

const schema = z.object({ value: z.string().min(1), label: z.string().min(1) });

// Database-driven so admins can add new retailer categories without a code change.
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const type = await prisma.businessType.create({ data: parsed.data });
    return NextResponse.json({ ok: true, type });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to create business type (value may already exist)" }, { status: 500 });
  }
}
