import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

const schema = z.object({ url: z.string(), category: z.string().default("other"), caption: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const photo = await prisma.farmPhoto.create({
      data: { farmerProfileId: user.farmerProfile!.id, url: parsed.data.url, category: parsed.data.category, caption: parsed.data.caption },
    });
    return NextResponse.json({ ok: true, photo });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
  }
}
