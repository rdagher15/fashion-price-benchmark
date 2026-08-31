import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { ORDER_STATUS, LISTING_STATUS, REQUIREMENT_STATUS } from "@/lib/constants";

const schema = z.object({
  receivedQuantity: z.number().positive(),
  receivedCondition: z.enum(["good", "damaged", "partial"]),
  receivedNote: z.string().optional(),
  quantityCorrect: z.boolean(),
  qualityConfirmed: z.boolean(),
  packagingConfirmed: z.boolean(),
  deliveryAcceptable: z.boolean(),
  signatureName: z.string().min(1),
  signatureLatitude: z.number().optional(),
  signatureLongitude: z.number().optional(),
});

// Digital delivery confirmation — a lightweight e-signature (typed name +
// timestamp + optional GPS) rather than a full signature-pad, sufficient for
// the MVP per the product spec.
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

    const now = new Date();
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.COMPLETED,
        confirmedAt: now,
        receivedQuantity: data.receivedQuantity,
        receivedCondition: data.receivedCondition,
        receivedNote: data.receivedNote,
        quantityCorrect: data.quantityCorrect,
        qualityConfirmed: data.qualityConfirmed,
        packagingConfirmed: data.packagingConfirmed,
        deliveryAcceptable: data.deliveryAcceptable,
        signatureName: data.signatureName,
        signedAt: now,
        signatureLatitude: data.signatureLatitude,
        signatureLongitude: data.signatureLongitude,
      },
    });

    await prisma.listing.update({ where: { id: order.listingId }, data: { status: LISTING_STATUS.COMPLETED } }).catch(() => {});
    if (order.requirementId) {
      await prisma.requirement.update({ where: { id: order.requirementId }, data: { status: REQUIREMENT_STATUS.FULFILLED } }).catch(() => {});
    }
    await prisma.farmerProfile.update({ where: { id: order.farmerProfileId }, data: { completedOrders: { increment: 1 } } });
    await prisma.buyerProfile.update({ where: { id: order.buyerProfileId }, data: { completedOrders: { increment: 1 } } });

    await notify(order.farmerProfile.userId, "DELIVERY_CONFIRMED", "Delivery confirmed", `Order ${order.orderNumber} receipt confirmed and digitally signed by the buyer. Transaction completed.`, `/farmer/orders/${order.id}`);

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 });
  }
}
