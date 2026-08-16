import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { IsoStandard } from "@prisma/client";

// =====================================================================
// DOCUMENT CONTROL SYSTEM (ISO-compliant, versioned)
// Central repository with multi-attachment + version history per doc.
// Document codes: RES/QMS/PRC/001 style (configurable via NumberingConfig
// or passed in directly).
// =====================================================================

export async function listDocumentCategories() {
  return prisma.documentCategory.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
    include: { _count: { select: { documents: true } } },
  });
}

export async function createDocumentCategory(data: {
  code: string;
  name: string;
  type?: string;
  module?: string;
  description?: string | null;
}) {
  return prisma.documentCategory.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type ?? "DOCUMENT",
      module: data.module ?? "QUALITY",
      description: data.description,
    },
  });
}

export async function listDocuments(opts: { status?: string; module?: string; projectId?: number } = {}) {
  return prisma.document.findMany({
    where: {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.module ? { module: opts.module } : {}),
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
    },
    include: {
      category: true,
      versions: { orderBy: { versionNo: "desc" }, take: 1 },
    },
    orderBy: { docCode: "asc" },
    take: 500,
  });
}

export async function createDocument(data: {
  docCode: string;
  title: string;
  categoryId?: number | null;
  module: string;
  isoStandard?: IsoStandard;
  description?: string | null;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  ownerUserId?: number | null;
  projectId?: number | null;
}) {
  const record = await prisma.document.create({
    data: {
      docCode: data.docCode,
      title: data.title,
      categoryId: data.categoryId ?? null,
      module: data.module,
      isoStandard: data.isoStandard ?? "NONE",
      description: data.description,
      status: "DRAFT",
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      ownerUserId: data.ownerUserId ?? null,
      projectId: data.projectId ?? null,
      currentVersion: "1.0",
    },
  });
  await auditLog({
    userId: data.ownerUserId,
    action: "CREATE",
    module: MODULES.DOCUMENTS,
    entity: "DOCUMENT",
    entityId: record.id,
    details: { docCode: record.docCode, title: record.title },
  });
  return record;
}

/**
 * Add a new version of a document (version control). Updates the current
 * version pointer. Old versions remain as immutable history.
 */
export async function addDocumentVersion(data: {
  documentId: number;
  versionNo: string;
  fileName: string;
  fileUrl: string;
  changeSummary?: string | null;
  uploadedById?: number | null;
}) {
  const doc = await prisma.document.findUnique({ where: { id: data.documentId } });
  if (!doc) throw new Error("Document not found.");

  const version = await prisma.$transaction(async (tx) => {
    const v = await tx.documentVersion.create({
      data: {
        documentId: data.documentId,
        versionNo: data.versionNo,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        changeSummary: data.changeSummary,
        uploadedById: data.uploadedById ?? null,
      },
    });
    await tx.document.update({
      where: { id: data.documentId },
      data: { currentVersion: data.versionNo, updatedAt: new Date() },
    });
    return v;
  });

  await auditLog({
    userId: data.uploadedById,
    action: "UPDATE",
    module: MODULES.DOCUMENTS,
    entity: "DOCUMENT_VERSION",
    entityId: version.id,
    details: { documentId: data.documentId, versionNo: data.versionNo },
  });
  return version;
}

/** Documents whose expiry date is within `days` (default 30) — expiry alerts. */
export async function documentExpiryAlerts(days = 30) {
  const from = new Date();
  const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return prisma.document.findMany({
    where: {
      status: { not: "OBSOLETE" },
      expiryDate: { not: null, lte: to, gte: from },
    },
    include: { category: true, project: { select: { id: true, code: true, name: true } } },
    orderBy: { expiryDate: "asc" },
  });
}

export async function getDocumentDetail(id: number) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      category: true,
      project: { select: { id: true, code: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { versionNo: "desc" }, include: { uploadedBy: { select: { id: true, name: true } } } },
    },
  });
}

export async function updateDocumentStatus(id: number, status: string) {
  return prisma.document.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  });
}
