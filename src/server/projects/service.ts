import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import { Prisma, type ProjectCategory, type ProjectStatus, type ProjectAccessRole } from "@prisma/client";

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

/**
 * Next auto project code: PRJ-001, PRJ-002, ... derived from the highest
 * existing PRJ-### code so seeded/historical codes are never reused.
 */
export async function nextProjectCode(): Promise<string> {
  const rows = await prisma.project.findMany({
    where: { code: { startsWith: "PRJ-" } },
    select: { code: true },
  });
  let max = 0;
  for (const r of rows) {
    const m = /^PRJ-(\d+)$/.exec(r.code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `PRJ-${String(max + 1).padStart(3, "0")}`;
}

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
  code?: string;
  name: string;
  category?: ProjectCategory;
  clientId?: number | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  status?: ProjectStatus;
  managerEmployeeId?: number | null;
  assetAccountId?: number | null;
  incomeAccountId?: number | null;
  description?: string | null;
  projectUsers?: { userId: number; role: ProjectAccessRole }[];
}) {
  // Guard the account types used for IPC/billing posting.
  if (data.assetAccountId != null) {
    const acc = await prisma.account.findUnique({ where: { id: data.assetAccountId }, select: { type: true } });
    if (!acc || acc.type !== "ASSET") throw new Error("Asset account must be an ASSET-type chart of accounts entry.");
  }
  if (data.incomeAccountId != null) {
    const acc = await prisma.account.findUnique({ where: { id: data.incomeAccountId }, select: { type: true } });
    if (!acc || acc.type !== "REVENUE") throw new Error("Income account must be a REVENUE-type chart of accounts entry.");
  }

  let record: Awaited<ReturnType<typeof prisma.project.create>> | null = null;

  // Auto-allocate a unique code (PRJ-001, PRJ-002, ...) unless one is supplied.
  for (let attempt = 0; attempt < 5 && !record; attempt++) {
    const code = data.code?.trim() || (await nextProjectCode());
    try {
      record = await prisma.project.create({
        data: {
          code,
          name: data.name,
          category: data.category ?? "CONSTRUCTION",
          clientId: data.clientId ?? null,
          location: data.location ?? null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          budget: data.budget ?? 0,
          status: data.status ?? "PLANNING",
          managerEmployeeId: data.managerEmployeeId ?? null,
          assetAccountId: data.assetAccountId ?? null,
          incomeAccountId: data.incomeAccountId ?? null,
          description: data.description,
          projectUsers: data.projectUsers?.length
            ? { create: data.projectUsers.map((u) => ({ userId: u.userId, role: u.role })) }
            : undefined,
        },
      });
    } catch (e) {
      // Two concurrent creates can pick the same code — recompute and retry.
      if (!data.code && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        continue;
      }
      throw e;
    }
  }

  if (!record) {
    throw new Error("Could not allocate a unique project code. Please try again.");
  }

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
      assetAccount: { select: { id: true, code: true, name: true, type: true } },
      incomeAccount: { select: { id: true, code: true, name: true, type: true } },
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
