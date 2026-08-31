import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const n = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!n || n.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.notification.update({ where: { id: params.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
