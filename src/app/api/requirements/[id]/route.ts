import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { matchLabel } from "@/lib/matching";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const requirement = await prisma.requirement.findUnique({
    where: { id: params.id },
    include: {
      produceCategory: true,
      buyerProfile: true,
      matches: { include: { listing: { include: { produceCategory: true, farmerProfile: true } } }, orderBy: { score: "desc" } },
    },
  });
  if (!requirement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ requirement });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("BUYER");
    const requirement = await prisma.requirement.findUnique({ where: { id: params.id } });
    if (!requirement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // A buyer may never modify another buyer's requirement.
    if (requirement.buyerProfileId !== user.buyerProfile!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const allowed = ["status", "quantity"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) data[key] = body[key];
    const updated = await prisma.requirement.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, requirement: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 });
  }
}
