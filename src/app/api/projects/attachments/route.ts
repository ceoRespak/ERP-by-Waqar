import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjectAttachments, createProjectAttachment } from "@/server/projects/attachments";
import { saveUpload } from "@/lib/upload";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ? Number(searchParams.get("projectId")) : null;
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_READ, projectId);
  if (!user) return unauthorized();
  try {
    const attachments = await listProjectAttachments(projectId);
    return ok({ attachments });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return fail("Invalid multipart form.");

  const projectIdRaw = form.get("projectId");
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;
  const isPermanent = form.get("isPermanent") === "true";
  const nameTag = String(form.get("nameTag") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const file = form.get("file");

  if (!nameTag) return fail("nameTag is required.");
  if (!title) return fail("title is required.");
  if (!(file instanceof File)) return fail("file is required.");
  if (file.size > MAX_FILE_SIZE) return fail("File is too large (max 25 MB).");

  const permProjectId = isPermanent ? null : projectId;
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_CREATE, permProjectId);
  if (!user) return unauthorized();

  try {
    const subFolder = isPermanent ? "projects/permanent" : `projects/${projectId}`;
    const saved = await saveUpload(file, subFolder);
    const record = await createProjectAttachment({
      projectId: isPermanent ? null : projectId,
      nameTag,
      title,
      description,
      isPermanent,
      uploadedById: Number(user.id),
      ...saved,
    });
    return ok({ attachment: record });
  } catch (e) {
    return handleError(e);
  }
}
