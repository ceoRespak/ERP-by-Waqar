import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export type UploadedFile = {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
};

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "file";
}

/** Write an uploaded File to public/uploads/<subFolder> and return its public URL. */
export async function saveUpload(file: File, subFolder: string): Promise<UploadedFile> {
  const safeName = sanitizeFileName(file.name);
  const ext = path.extname(safeName);
  const base = path.basename(safeName, ext);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storedName = `${base}-${stamp}${ext}`;

  const dir = path.join(UPLOAD_ROOT, subFolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return {
    fileName: safeName,
    fileUrl: `/uploads/${subFolder}/${storedName}`.replace(/\\/g, "/"),
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
  };
}

/** Best-effort removal of a previously uploaded file (ignores missing files). */
export async function deleteUploaded(fileUrl: string): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const abs = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  try {
    await unlink(abs);
  } catch {
    // ignore
  }
}
