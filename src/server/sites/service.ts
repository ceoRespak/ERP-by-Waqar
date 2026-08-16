import { prisma } from "@/lib/db";
import { nextDocNo } from "@/server/docno";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";

// =====================================================================
// SITE MANAGEMENT: DPR, Check Request, Submittal, Transmittal
// =====================================================================

// ---- DPR (Daily Progress Report) ----
export async function listDprs(opts: { limit?: number; projectId?: number } = {}) {
  return prisma.dPR.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { reportDate: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createDpr(data: {
  projectId: number;
  reportDate?: string;
  preparedById?: number | null;
  preparedByName?: string | null;
  weather?: string | null;
  workDone: string;
  manpower?: string | null;
  equipment?: string | null;
  materialReceived?: string | null;
  issues?: string | null;
  nextPlan?: string | null;
}) {
  const dprNo = await nextDocNo("dprNo", "DPR", (args) => prisma.dPR.findFirst(args as any));
  const record = await prisma.dPR.create({
    data: {
      dprNo,
      projectId: data.projectId,
      reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
      preparedById: data.preparedById ?? null,
      preparedByName: data.preparedByName ?? null,
      weather: data.weather,
      workDone: data.workDone,
      manpower: data.manpower,
      equipment: data.equipment,
      materialReceived: data.materialReceived,
      issues: data.issues,
      nextPlan: data.nextPlan,
      status: "DRAFT",
    },
  });
  return record;
}

export async function submitDpr(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.dPR.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("DPR not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.DPR,
    entityId: record.id,
    module: MODULES.SITES,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---- Check Request ----
export async function listCheckRequests(opts: { limit?: number; projectId?: number } = {}) {
  return prisma.checkRequest.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createCheckRequest(data: {
  projectId: number;
  date?: string;
  amount: number;
  payeeName: string;
  payeeType?: string | null;
  description: string;
}) {
  const requestNo = await nextDocNo("requestNo", "CR", (args) => prisma.checkRequest.findFirst(args as any));
  const record = await prisma.checkRequest.create({
    data: {
      requestNo,
      projectId: data.projectId,
      date: data.date ? new Date(data.date) : new Date(),
      amount: data.amount,
      payeeName: data.payeeName,
      payeeType: data.payeeType ?? "OTHER",
      description: data.description,
      status: "DRAFT",
    },
  });
  return record;
}

export async function submitCheckRequest(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.checkRequest.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Check request not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.CHECK_REQUEST,
    entityId: record.id,
    module: MODULES.SITES,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---- Submittal ----
export async function listSubmittals(opts: { limit?: number; projectId?: number } = {}) {
  return prisma.submittal.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createSubmittal(data: {
  projectId: number;
  date?: string;
  title: string;
  category?: string | null;
  description?: string | null;
}) {
  const submittalNo = await nextDocNo("submittalNo", "SUB", (args) => prisma.submittal.findFirst(args as any));
  const record = await prisma.submittal.create({
    data: {
      submittalNo,
      projectId: data.projectId,
      date: data.date ? new Date(data.date) : new Date(),
      title: data.title,
      category: data.category ?? null,
      description: data.description,
      status: "DRAFT",
    },
  });
  return record;
}

export async function submitSubmittal(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.submittal.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Submittal not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.SUBMITTAL,
    entityId: record.id,
    module: MODULES.SITES,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---- Transmittal ----
export async function listTransmittals(opts: { limit?: number; projectId?: number } = {}) {
  return prisma.transmittal.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createTransmittal(data: {
  projectId: number;
  date?: string;
  subject: string;
  receiverName?: string | null;
  receiverOrg?: string | null;
  description?: string | null;
  status?: string;
}) {
  const transmittalNo = await nextDocNo("transmittalNo", "TR", (args) => prisma.transmittal.findFirst(args as any));
  const record = await prisma.transmittal.create({
    data: {
      transmittalNo,
      projectId: data.projectId,
      date: data.date ? new Date(data.date) : new Date(),
      subject: data.subject,
      receiverName: data.receiverName ?? null,
      receiverOrg: data.receiverOrg ?? null,
      description: data.description,
      status: data.status ?? "SENT",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.SITES, entity: "TRANSMITTAL", entityId: record.id, details: { transmittalNo } });
  return record;
}
