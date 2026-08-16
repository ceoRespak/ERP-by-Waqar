import { prisma } from "@/lib/db";
import { generateRefNo } from "@/server/refno/service";
import { REF_DOC_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";
import type { CorrespondenceType } from "@prisma/client";

// =====================================================================
// CORRESPONDENCE — Letter In / Letter Out / Internal Memo
// Auto reference numbers via the numbering engine:
//   LETTER_IN -> LI/PROJECT/YEAR/#### , LETTER_OUT -> LO/... ,
//   INTERNAL_MEMO -> IM/...
// =====================================================================

const TYPE_TO_DOC = {
  LETTER_IN: REF_DOC_TYPES.LETTER_IN,
  LETTER_OUT: REF_DOC_TYPES.LETTER_OUT,
  INTERNAL_MEMO: REF_DOC_TYPES.INTERNAL_MEMO,
} as const;

export async function listCorrespondence(opts: { projectId?: number; type?: string } = {}) {
  return prisma.correspondence.findMany({
    where: {
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.type ? { type: opts.type as CorrespondenceType } : {}),
    },
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: { date: "desc" },
    take: 300,
  });
}

export async function getCorrespondenceDetail(id: number) {
  return prisma.correspondence.findUnique({
    where: { id },
    include: { project: { select: { id: true, code: true, name: true } } },
  });
}

export async function createCorrespondence(data: {
  projectId?: number | null;
  type: CorrespondenceType;
  date?: string | null;
  fromName?: string | null;
  toName?: string | null;
  subject: string;
  body?: string | null;
}) {
  const project = data.projectId ? await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } }) : null;
  const refNo = await generateRefNo(TYPE_TO_DOC[data.type], { projectCode: project?.code });

  // Letters in are received; letters out & memos are sent.
  const status = data.type === "LETTER_IN" ? "RECEIVED" : "SENT";

  const record = await prisma.correspondence.create({
    data: {
      refNo,
      type: data.type,
      projectId: data.projectId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      fromName: data.fromName ?? null,
      toName: data.toName ?? null,
      subject: data.subject,
      body: data.body ?? null,
      status,
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.CORRESPONDENCE,
    entity: "CORRESPONDENCE",
    entityId: record.id,
    details: { refNo: record.refNo, type: record.type },
  });
  return record;
}

export async function updateCorrespondenceStatus(id: number, status: string) {
  return prisma.correspondence.update({
    where: { id },
    data: { status },
  });
}
