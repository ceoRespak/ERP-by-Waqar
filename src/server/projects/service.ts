import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { ProjectCategory, ProjectStatus, ProjectAccessRole } from "@prisma/client";

// =====================================================================
// MULTI-PROJECT MANAGEMENT
// Supports unlimited projects across categories (Construction, Real
// Estate, Supply Works, Solarization, Other) with project-wise KPIs and
// per-user project assignment.
// =====================================================================

export const PROJECT_CATEGORIES = [
  "CONSTRUCTION",
  "REAL_ESTATE",
  "SUPPLY_WORKS",
  "SOLARIZATION",
  "OTHER",
] as const;

export async function listProjects(opts: { category?: ProjectCategory; status?: ProjectStatus; limit?: number } = {}) {
  return prisma.project.findMany({
    where: {
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      projectUsers: { include: { user: { select: { id: true, name: true } } } },
      _count: {
        select: { dprs: true, checkRequests: true, submittals: true, transmittals: true, boqs: true, activities: true, materialRequests: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 300,
  });
}

export async function createProject(data: {
  code: string;
  name: string;
  category?: ProjectCategory;
  clientId?: number | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  status?: ProjectStatus;
  managerEmployeeId?: number | null;
  description?: string | null;
  projectUsers?: { userId: number; role: ProjectAccessRole }[];
}) {
  const record = await prisma.project.create({
    data: {
      code: data.code,
      name: data.name,
      category: data.category ?? "CONSTRUCTION",
      clientId: data.clientId ?? null,
      location: data.location ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget ?? 0,
      status: data.status ?? "PLANNING",
      managerEmployeeId: data.managerEmployeeId ?? null,
      description: data.description,
      projectUsers: data.projectUsers?.length
        ? { create: data.projectUsers.map((u) => ({ userId: u.userId, role: u.role })) }
        : undefined,
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.PROJECTS,
    entity: "PROJECT",
    entityId: record.id,
    details: { code: record.code, name: record.name, category: record.category },
  });
  return record;
}

export async function assignProjectUser(params: {
  projectId: number;
  userId: number;
  role: ProjectAccessRole;
}) {
  return prisma.projectUser.upsert({
    where: { projectId_userId: { projectId: params.projectId, userId: params.userId } },
    create: params,
    update: { role: params.role },
  });
}

export async function removeProjectUser(projectId: number, userId: number) {
  return prisma.projectUser.delete({
    where: { projectId_userId: { projectId, userId } },
  });
}

/**
 * Project-wise KPI card data:
 *  - budget total (Budget.totalAmount)
 *  - actual cost (sum of CostLog)
 *  - % progress (latest ProjectProgress.actualPercent)
 *  - outstanding (budget - actual)
 */
export async function projectKpis(projectId: number) {
  const [budgetAgg, costAgg, latestProgress, openCostAlerts, openNcr, openIncidents] = await Promise.all([
    prisma.budget.aggregate({ where: { projectId }, _sum: { totalAmount: true } }),
    prisma.costLog.aggregate({ where: { projectId }, _sum: { amount: true } }),
    prisma.projectProgress.findFirst({
      where: { projectId },
      orderBy: { reportDate: "desc" },
    }),
    prisma.costAlert.count({ where: { projectId, resolved: false } }),
    prisma.nCR.count({ where: { projectId, status: { not: "CLOSED" } } }),
    prisma.safetyIncident.count({ where: { projectId, investigationStatus: { not: "CLOSED" } } }),
  ]);

  const budget = budgetAgg._sum.totalAmount?.toNumber() ?? 0;
  const actual = costAgg._sum.amount?.toNumber() ?? 0;

  return {
    budget,
    actualCost: actual,
    variance: budget - actual,
    progressPercent: latestProgress?.actualPercent.toNumber() ?? 0,
    plannedPercent: latestProgress?.plannedPercent.toNumber() ?? 0,
    openCostAlerts,
    openNcr,
    openIncidents,
  };
}

/** Full project detail + dashboard payload for /projects/[id]. */
export async function getProjectDetail(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { id: true, name: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      projectUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: {
        select: {
          dprs: true, checkRequests: true, submittals: true, transmittals: true,
          boqs: true, activities: true, materialRequests: true, costLogs: true,
          documents: true, ncr: true, riskAssessments: true, safetyIncidents: true,
        },
      },
    },
  });
  if (!project) return null;

  const kpis = await projectKpis(projectId);

  const [recentDprs, recentCostLogs, recentApprovals] = await Promise.all([
    prisma.dPR.findMany({ where: { projectId }, orderBy: { reportDate: "desc" }, take: 5 }),
    prisma.costLog.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 8 }),
    prisma.approvalRequest.findMany({
      where: { entityType: { in: ["PURCHASE_REQUISITION", "PURCHASE_ORDER", "CHECK_REQUEST", "MATERIAL_REQUEST", "IPC", "VARIATION_ORDER"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return { project, kpis, recentDprs, recentCostLogs, recentApprovals };
}
