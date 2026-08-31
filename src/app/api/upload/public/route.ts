import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/upload";

// No account exists yet mid-registration (CR document, business photo), so
// this endpoint intentionally skips auth — scoped narrowly to registration
// assets only, distinct from the authenticated /api/upload used everywhere
// else in the app (listing photos, farm photos, receiving photos).
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const result = await saveUpload(file, true);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, url: result.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
