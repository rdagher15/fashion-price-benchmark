import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { produceCategory: true, farmerProfile: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("FARMER");
    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // A farmer may never modify another farmer's listing.
    if (listing.farmerProfileId !== user.farmerProfile!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const allowed = ["status", "quantity", "minPrice", "maxPrice", "preferredPrice"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) data[key] = body[key];

    const updated = await prisma.listing.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, listing: updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
