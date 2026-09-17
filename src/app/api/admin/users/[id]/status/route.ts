import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const user = await prisma.user.update({ where: { id: params.id }, data: { status: parsed.data.status } });
    return NextResponse.json({ ok: true, user: { id: user.id, status: user.status } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
