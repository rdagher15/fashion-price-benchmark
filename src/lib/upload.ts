import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function saveUpload(file: File, allowDocuments = false): Promise<{ url: string } | { error: string }> {
  const allowed = allowDocuments ? DOCUMENT_TYPES : IMAGE_TYPES;
  if (!allowed.includes(file.type)) return { error: allowDocuments ? "Unsupported file type (images or PDF only)" : "Unsupported file type" };
  if (file.size > MAX_BYTES) return { error: "File too large (max 8MB)" };

  const ext = file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return { url: `/uploads/${filename}` };
}
