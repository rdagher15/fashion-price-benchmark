import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/constants";

const schema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { farmerProfile: true, buyerProfile: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== ORDER_STATUS.COMPLETED) return NextResponse.json({ error: "Order not completed yet" }, { status: 409 });

    const isFarmer = user.role === "FARMER" && user.farmerProfile?.id === order.farmerProfileId;
    const isBuyer = user.role === "BUYER" && user.buyerProfile?.id === order.buyerProfileId;
    if (!isFarmer && !isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const reviewedPartyId = isFarmer ? order.buyerProfile.userId : order.farmerProfile.userId;
    const existing = await prisma.review.findFirst({ where: { orderId: order.id, reviewerId: user.id } });
    if (existing) return NextResponse.json({ error: "You already reviewed this order" }, { status: 409 });

    await prisma.review.create({
      data: { orderId: order.id, reviewerId: user.id, reviewedPartyId, rating: parsed.data.rating, comment: parsed.data.comment },
    });

    const targetProfile = isFarmer ? "buyerProfile" : "farmerProfile";
    const targetId = isFarmer ? order.buyerProfileId : order.farmerProfileId;
    const model = isFarmer ? prisma.buyerProfile : prisma.farmerProfile;
    const current = await (model as any).findUnique({ where: { id: targetId } });
    const newCount = current.ratingCount + 1;
    const newAvg = (current.ratingAvg * current.ratingCount + parsed.data.rating) / newCount;
    await (model as any).update({ where: { id: targetId }, data: { ratingCount: newCount, ratingAvg: newAvg } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
