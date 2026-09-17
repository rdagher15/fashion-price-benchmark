import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

const schema = z.object({ verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const profile = await prisma.farmerProfile.update({ where: { id: params.id }, data: { verificationStatus: parsed.data.verificationStatus } });
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
