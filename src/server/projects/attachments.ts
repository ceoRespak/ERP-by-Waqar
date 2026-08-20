import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";

// =====================================================================
// PROJECT ATTACHMENTS
// Files tagged by type (Work Order, Agreement, CDR, Guarantees, Letters…).
// isPermanent + projectId null = shared across ALL projects.
// =====================================================================

export async function listProjectAttachments(projectId?: number | null) {
  return prisma.projectAttachment.findMany({
    where: {
      OR: [{ isPermanent: true }, ...(projectId ? [{ projectId }] : [])],
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: [{ isPermanent: "desc" }, { nameTag: "asc" }, { createdAt: "desc" }],
  });
}

export async function createProjectAttachment(data: {
  projectId?: number | null;
  nameTag: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  fileType?: string | null;
  description?: string | null;
  isPermanent?: boolean;
  uploadedById?: number | null;
}) {
  const isPermanent = data.isPermanent ?? !data.projectId;
  const record = await prisma.projectAttachment.create({
    data: {
      projectId: isPermanent ? null : (data.projectId ?? null),
      nameTag: data.nameTag,
      title: data.title,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ?? null,
      fileType: data.fileType ?? null,
      description: data.description ?? null,
      isPermanent,
      uploadedById: data.uploadedById ?? null,
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.PROJECTS,
    entity: "PROJECT_ATTACHMENT",
    entityId: record.id,
    details: { nameTag: record.nameTag, title: record.title, projectId: data.projectId, isPermanent },
  });
  return record;
}

export async function deleteProjectAttachment(id: number) {
  const record = await prisma.projectAttachment.findUnique({ where: { id } });
  if (!record) throw new Error("Attachment not found.");
  await prisma.projectAttachment.delete({ where: { id } });
  await auditLog({
    action: "DELETE",
    module: MODULES.PROJECTS,
    entity: "PROJECT_ATTACHMENT",
    entityId: id,
    details: { nameTag: record.nameTag, title: record.title, isPermanent: record.isPermanent },
  });
  return record;
}
