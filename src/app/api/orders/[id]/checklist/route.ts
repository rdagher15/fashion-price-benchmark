import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

const schema = z.object({ itemId: z.string(), completed: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("FARMER");
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.farmerProfileId !== user.farmerProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const item = await prisma.orderChecklistItem.update({
      where: { id: parsed.data.itemId },
      data: { completed: parsed.data.completed, completedAt: parsed.data.completed ? new Date() : null },
    });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
