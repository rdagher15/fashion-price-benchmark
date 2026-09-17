import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { ORDER_STATUS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const schema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("side_with_buyer"),
    resolutionType: z.enum(["REFUND_FULL", "REFUND_PARTIAL", "REPLACEMENT", "CREDIT"]),
    amount: z.number().min(0).optional(),
    note: z.string().optional(),
  }),
  z.object({
    decision: z.literal("side_with_farmer"),
    note: z.string().optional(),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { buyerProfile: { include: { user: true } }, farmerProfile: { include: { user: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== ORDER_STATUS.DISPUTED) {
      return NextResponse.json({ error: "This order is not currently disputed." }, { status: 409 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    let resolutionType: string;
    let amount: number;
    if (data.decision === "side_with_buyer") {
      if (data.resolutionType === "REFUND_PARTIAL" && !(data.amount && data.amount > 0 && data.amount <= order.totalValue)) {
        return NextResponse.json({ error: "Enter a partial refund amount between 0 and the order total." }, { status: 400 });
      }
      resolutionType = data.resolutionType;
      amount = data.resolutionType === "REFUND_FULL" ? order.totalValue : data.resolutionType === "REFUND_PARTIAL" ? data.amount! : data.amount ?? 0;
    } else {
      resolutionType = "DISMISSED";
      amount = 0;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.COMPLETED,
        resolutionType,
        resolutionAmount: amount,
        resolutionNote: data.note,
        resolvedAt: new Date(),
        resolvedBy: "ADMIN",
      },
    });

    const summary =
      data.decision === "side_with_buyer"
        ? `${resolutionType.replace("_", " ").toLowerCase()}${amount ? ` (${formatMoney(amount)})` : ""}`
        : "the claim was dismissed";

    await Promise.all([
      notify(order.buyerProfile.userId, "DISPUTE_RESOLVED", "Dispute resolved", `HarvestLink support resolved order ${order.orderNumber}: ${summary}.`, `/buyer/orders/${order.id}`),
      notify(order.farmerProfile.userId, "DISPUTE_RESOLVED", "Dispute resolved", `HarvestLink support resolved order ${order.orderNumber}: ${summary}.`, `/farmer/orders/${order.id}`),
    ]);

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}
