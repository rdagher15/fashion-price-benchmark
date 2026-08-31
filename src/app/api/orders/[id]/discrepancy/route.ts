import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { ORDER_STATUS } from "@/lib/constants";

const schema = z.object({
  types: z.array(z.string()).min(1),
  note: z.string().optional(),
  actualQuantity: z.number().positive().optional(),
  photoUrls: z.array(z.string()).default([]),
});

// Preserves the full transaction record rather than discarding it — a full
// dispute-resolution workflow is a future feature, this just captures the
// facts so support/admin can follow up.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("BUYER");
    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { farmerProfile: { include: { user: true } } } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.buyerProfileId !== user.buyerProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== ORDER_STATUS.DELIVERED) {
      return NextResponse.json({ error: "This order has not been marked delivered yet." }, { status: 409 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.DISCREPANCY,
        discrepancyTypesJson: JSON.stringify(data.types),
        discrepancyNote: data.note,
        discrepancyPhotosJson: JSON.stringify(data.photoUrls),
        discrepancyReportedAt: new Date(),
        receivedQuantity: data.actualQuantity,
      },
    });

    await notify(
      order.farmerProfile.userId,
      "DISCREPANCY_REPORTED",
      "Discrepancy reported",
      `The buyer reported an issue with order ${order.orderNumber}: ${data.types.join(", ")}.${data.note ? ` "${data.note}"` : ""}`,
      `/farmer/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to report discrepancy" }, { status: 500 });
  }
}
