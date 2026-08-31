import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const where =
      user.role === "FARMER"
        ? { farmerProfileId: user.farmerProfile!.id }
        : user.role === "BUYER"
        ? { buyerProfileId: user.buyerProfile!.id }
        : {};
    const orders = await prisma.order.findMany({
      where,
      include: { buyerProfile: true, farmerProfile: true, checklist: true },
      orderBy: { deliveryDate: "asc" },
    });
    return NextResponse.json({ orders });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
