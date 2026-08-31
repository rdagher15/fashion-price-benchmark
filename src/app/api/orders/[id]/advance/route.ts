import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { ORDER_STATUS, ORDER_STATUS_FLOW, LISTING_STATUS } from "@/lib/constants";

const schema = z.object({
  deliveryPersonType: z.enum(["farmer", "other_farmer", "driver", "third_party", "buyer_pickup"]).optional(),
  deliveryPersonName: z.string().optional(),
  deliveryContact: z.string().optional(),
});

// Farmer-driven forward progression: Accepted -> Preparing -> Ready -> Out for
// Delivery -> Delivered. Buyer confirmation (separate endpoint) takes it the
// rest of the way to Completed.
const LISTING_STATUS_FOR: Record<string, string> = {
  [ORDER_STATUS.PREPARING]: LISTING_STATUS.ORDER_PREPARATION,
  [ORDER_STATUS.READY]: LISTING_STATUS.READY_FOR_DELIVERY,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: LISTING_STATUS.OUT_FOR_DELIVERY,
  [ORDER_STATUS.DELIVERED]: LISTING_STATUS.DELIVERED,
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("FARMER");
    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { buyerProfile: { include: { user: true } } } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.farmerProfileId !== user.farmerProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const idx = ORDER_STATUS_FLOW.indexOf(order.status);
    if (idx === -1 || idx >= ORDER_STATUS_FLOW.indexOf(ORDER_STATUS.DELIVERED)) {
      return NextResponse.json({ error: "Order cannot be advanced further from here." }, { status: 409 });
    }
    const nextStatus = ORDER_STATUS_FLOW[idx + 1];

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const extra = parsed.success ? parsed.data : {};

    const data: Record<string, unknown> = { status: nextStatus, ...extra };
    if (nextStatus === ORDER_STATUS.OUT_FOR_DELIVERY) data.dispatchedAt = new Date();
    if (nextStatus === ORDER_STATUS.DELIVERED) data.deliveredAt = new Date();

    const updated = await prisma.order.update({ where: { id: order.id }, data });
    if (LISTING_STATUS_FOR[nextStatus]) {
      await prisma.listing.update({ where: { id: order.listingId }, data: { status: LISTING_STATUS_FOR[nextStatus] } }).catch(() => {});
    }

    const messages: Record<string, string> = {
      [ORDER_STATUS.PREPARING]: `Order ${order.orderNumber} is being prepared.`,
      [ORDER_STATUS.READY]: `Order ${order.orderNumber} is ready for delivery.`,
      [ORDER_STATUS.OUT_FOR_DELIVERY]: `Order ${order.orderNumber} is out for delivery.`,
      [ORDER_STATUS.DELIVERED]: `Order ${order.orderNumber} has been delivered — please confirm receipt.`,
    };
    await notify(order.buyerProfile.userId, "ORDER_STATUS", messages[nextStatus] ? "Order update" : "Order update", messages[nextStatus] || `Order ${order.orderNumber} status: ${nextStatus}`, `/buyer/orders/${order.id}`);

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
