import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";

const schema = z.object({
  supportTypes: z.array(z.string()).optional(),
  supportDescription: z.string().optional(),
  usesPesticides: z.boolean().optional(),
  usesFertilizers: z.boolean().optional(),
  organic: z.boolean().optional(),
  conventional: z.boolean().optional(),
  farmingNotes: z.string().optional(),
  certifications: z.array(z.object({ name: z.string(), docUrl: z.string().optional() })).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const update: Record<string, unknown> = {};
    if (data.supportTypes) update.supportTypesJson = JSON.stringify(data.supportTypes);
    if (data.supportDescription !== undefined) update.supportDescription = data.supportDescription;
    if (data.usesPesticides !== undefined) update.usesPesticides = data.usesPesticides;
    if (data.usesFertilizers !== undefined) update.usesFertilizers = data.usesFertilizers;
    if (data.organic !== undefined) update.organic = data.organic;
    if (data.conventional !== undefined) update.conventional = data.conventional;
    if (data.farmingNotes !== undefined) update.farmingNotes = data.farmingNotes;
    if (data.certifications) update.certificationsJson = JSON.stringify(data.certifications);

    const existing = await prisma.farmerProfile.findUnique({ where: { id: user.farmerProfile!.id } });
    const newPct = Math.min(100, (existing?.profileCompletionPct || 55) + 25);
    update.profileCompletionPct = newPct;

    const profile = await prisma.farmerProfile.update({ where: { id: user.farmerProfile!.id }, data: update });
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
