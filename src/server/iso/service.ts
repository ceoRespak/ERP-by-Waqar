import { prisma } from "@/lib/db";
import { generateRefNo } from "@/server/refno/service";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";

// =====================================================================
// ISO 9001 / 14001 / 45001 COMPLIANCE
// NCR + Corrective/Preventive Actions (CAPA), Risk Assessments,
// Training Records, Environmental Aspects, Safety Incidents.
// =====================================================================

// ---------------------------------------------------------------------
// NCR + CAPA
// ---------------------------------------------------------------------
export async function listNcrs(projectId?: number) {
  return prisma.nCR.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
      correctiveActions: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getNcrDetail(id: number) {
  return prisma.nCR.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      correctiveActions: true,
    },
  });
}

export async function createNcr(data: {
  projectId?: number | null;
  date?: string | null;
  source?: string | null;
  description: string;
  severity?: string;
}) {
  const project = data.projectId ? await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } }) : null;
  const ncrNo = await generateRefNo("NCR", { projectCode: project?.code ?? "GEN" });
  const record = await prisma.nCR.create({
    data: {
      ncrNo,
      projectId: data.projectId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      source: data.source ?? "INSPECTION",
      description: data.description,
      severity: data.severity ?? "MINOR",
      status: "OPEN",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.ISO, entity: "NCR", entityId: record.id, details: { ncrNo } });
  return record;
}

export async function submitNcr(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.nCR.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("NCR not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.NCR,
    entityId: record.id,
    module: MODULES.ISO,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

export async function addCorrectiveAction(data: {
  ncrId?: number | null;
  type?: string;
  title: string;
  rootCause?: string | null;
  action: string;
  responsibleId?: number | null;
  targetDate?: string | null;
}) {
  const record = await prisma.correctiveAction.create({
    data: {
      ncrId: data.ncrId ?? null,
      type: data.type ?? "CORRECTIVE",
      title: data.title,
      rootCause: data.rootCause ?? null,
      action: data.action,
      responsibleId: data.responsibleId ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: "OPEN",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.ISO, entity: "CORRECTIVE_ACTION", entityId: record.id, details: { title: record.title } });
  return record;
}

// ---------------------------------------------------------------------
// Risk assessments
// ---------------------------------------------------------------------
export async function listRisks(projectId?: number) {
  return prisma.riskAssessment.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
      activity: { select: { id: true, wbsCode: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createRisk(data: {
  projectId?: number | null;
  activityId?: number | null;
  date?: string | null;
  hazard: string;
  risk?: string | null;
  likelihood: number;
  severity: number;
  controlMeasures?: string | null;
}) {
  const likelihood = Math.min(5, Math.max(1, data.likelihood || 1));
  const severity = Math.min(5, Math.max(1, data.severity || 1));
  return prisma.riskAssessment.create({
    data: {
      projectId: data.projectId ?? null,
      activityId: data.activityId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      hazard: data.hazard,
      risk: data.risk ?? null,
      likelihood,
      severity,
      riskRating: likelihood * severity,
      controlMeasures: data.controlMeasures ?? null,
      status: "OPEN",
    },
  });
}

// ---------------------------------------------------------------------
// Training records
// ---------------------------------------------------------------------
export async function listTraining() {
  return prisma.trainingRecord.findMany({
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { trainingDate: "desc" },
    take: 200,
  });
}

export async function createTraining(data: {
  employeeId?: number | null;
  trainingTitle: string;
  provider?: string | null;
  trainingDate?: string | null;
  expiryDate?: string | null;
  certificateUrl?: string | null;
  competencyLevel?: string | null;
}) {
  return prisma.trainingRecord.create({
    data: {
      employeeId: data.employeeId ?? null,
      trainingTitle: data.trainingTitle,
      provider: data.provider ?? null,
      trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      certificateUrl: data.certificateUrl ?? null,
      competencyLevel: data.competencyLevel ?? "BASIC",
    },
  });
}

// ---------------------------------------------------------------------
// Environmental aspects
// ---------------------------------------------------------------------
export async function listAspects(projectId?: number) {
  return prisma.environmentalAspect.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createAspect(data: {
  projectId?: number | null;
  date?: string | null;
  activity: string;
  aspect: string;
  impact: string;
  significance?: string;
  controlMeasures?: string | null;
}) {
  return prisma.environmentalAspect.create({
    data: {
      projectId: data.projectId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      activity: data.activity,
      aspect: data.aspect,
      impact: data.impact,
      significance: data.significance ?? "LOW",
      controlMeasures: data.controlMeasures ?? null,
    },
  });
}

// ---------------------------------------------------------------------
// Safety incidents
// ---------------------------------------------------------------------
export async function listIncidents(projectId?: number) {
  return prisma.safetyIncident.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createIncident(data: {
  projectId?: number | null;
  date?: string | null;
  incidentType?: string;
  description: string;
  severity?: string;
  injuredEmployeeId?: number | null;
  rootCause?: string | null;
}) {
  const record = await prisma.safetyIncident.create({
    data: {
      projectId: data.projectId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      incidentType: data.incidentType ?? "NEAR_MISS",
      description: data.description,
      severity: data.severity ?? "MINOR",
      injuredEmployeeId: data.injuredEmployeeId ?? null,
      investigationStatus: "OPEN",
      rootCause: data.rootCause ?? null,
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.ISO, entity: "SAFETY_INCIDENT", entityId: record.id, details: { incidentType: record.incidentType } });
  return record;
}

export async function submitIncident(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.safetyIncident.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Incident not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.SAFETY_INCIDENT,
    entityId: record.id,
    module: MODULES.ISO,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}
