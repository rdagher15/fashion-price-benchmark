import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (user.status === "SUSPENDED") {
    return NextResponse.json({ error: "This account has been suspended. Contact support." }, { status: 403 });
  }

  await createSession({ userId: user.id, role: user.role as any });
  return NextResponse.json({ ok: true, role: user.role });
}
