import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { ORDER_STATUS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept"),
    resolutionType: z.enum(["REFUND_FULL", "REFUND_PARTIAL", "REPLACEMENT", "CREDIT"]),
    amount: z.number().min(0).optional(),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal("dispute"),
    note: z.string().min(1, "Please explain why you're disputing this claim."),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("FARMER");
    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { buyerProfile: { include: { user: true } } } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.farmerProfileId !== user.farmerProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== ORDER_STATUS.DISCREPANCY) {
      return NextResponse.json({ error: "This order has no pending discrepancy to respond to." }, { status: 409 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    if (data.action === "accept") {
      if (data.resolutionType === "REFUND_PARTIAL" && !(data.amount && data.amount > 0 && data.amount <= order.totalValue)) {
        return NextResponse.json({ error: "Enter a partial refund amount between 0 and the order total." }, { status: 400 });
      }
      const amount = data.resolutionType === "REFUND_FULL" ? order.totalValue : data.resolutionType === "REFUND_PARTIAL" ? data.amount! : data.amount ?? 0;

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: ORDER_STATUS.COMPLETED,
          resolutionType: data.resolutionType,
          resolutionAmount: amount,
          resolutionNote: data.note,
          resolvedAt: new Date(),
          resolvedBy: "FARMER",
        },
      });

      await notify(
        order.buyerProfile.userId,
        "DISCREPANCY_RESOLVED",
        "Discrepancy resolved",
        `The farmer resolved your report on order ${order.orderNumber}: ${data.resolutionType.replace("_", " ").toLowerCase()}${amount ? ` (${formatMoney(amount)})` : ""}.`,
        `/buyer/orders/${order.id}`
      );

      return NextResponse.json({ ok: true, order: updated });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.DISPUTED, farmerResponseNote: data.note },
    });

    await notify(
      order.buyerProfile.userId,
      "DISCREPANCY_DISPUTED",
      "Farmer disputed your report",
      `The farmer disputed your discrepancy report on order ${order.orderNumber}. HarvestLink support will review and resolve it.`,
      `/buyer/orders/${order.id}`
    );

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    await Promise.all(
      admins.map((a) =>
        notify(
          a.id,
          "DISPUTE_ESCALATED",
          "Order dispute needs review",
          `Order ${order.orderNumber} discrepancy is disputed by the farmer and needs arbitration.`,
          `/admin/orders`
        )
      )
    );

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to respond to discrepancy" }, { status: 500 });
  }
}
