import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { buyerProfile: true, farmerProfile: true, checklist: { orderBy: { sortOrder: "asc" } }, offer: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isParty =
      (user.role === "FARMER" && user.farmerProfile?.id === order.farmerProfileId) ||
      (user.role === "BUYER" && user.buyerProfile?.id === order.buyerProfileId) ||
      user.role === "ADMIN";
    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
