import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { saveUpload } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const result = await saveUpload(file);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, url: result.url });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
