import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES, type CostType } from "@/lib/constants";

// =====================================================================
// BUDGETING — project budgets, budget lines (by activity / BOQ item /
// cost type), and automatic cost alerts when actuals exceed thresholds.
// =====================================================================

export async function listBudgets(projectId?: number) {
  return prisma.budget.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
      lines: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getBudgetDetail(id: number) {
  return prisma.budget.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      lines: {
        include: {
          activity: { select: { id: true, wbsCode: true, name: true } },
          boqItem: { select: { id: true, itemCode: true, description: true } },
          account: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });
}

export async function createBudget(data: {
  projectId: number;
  name: string;
  period?: string | null;
  lines: { activityId?: number | null; boqItemId?: number | null; costType?: CostType; accountId?: number | null; amount: number }[];
}) {
  const totalAmount = data.lines.reduce((s, l) => s + (l.amount || 0), 0);
  const record = await prisma.budget.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      period: data.period ?? null,
      totalAmount,
      status: "DRAFT",
      lines: {
        create: data.lines.map((l) => ({
          activityId: l.activityId ?? null,
          boqItemId: l.boqItemId ?? null,
          costType: l.costType ?? "MATERIAL",
          accountId: l.accountId ?? null,
          amount: l.amount || 0,
        })),
      },
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.BUDGET,
    entity: "BUDGET",
    entityId: record.id,
    details: { name: record.name, projectId: data.projectId, totalAmount },
  });
  return record;
}

export async function recomputeBudgetTotal(budgetId: number) {
  const lines = await prisma.budgetLine.findMany({ where: { budgetId } });
  const total = lines.reduce((s, l) => s + l.amount.toNumber(), 0);
  return prisma.budget.update({ where: { id: budgetId }, data: { totalAmount: total } });
}

export async function deleteBudgetLine(lineId: number) {
  const line = await prisma.budgetLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("Budget line not found.");
  await prisma.budgetLine.delete({ where: { id: lineId } });
  await recomputeBudgetTotal(line.budgetId);
  return line;
}

// ---------------------------------------------------------------------
// Cost alerts — compare actual cost (CostLog ledger) against budget
// lines grouped by cost type; raise an alert when a line is exceeded.
// ---------------------------------------------------------------------
export async function checkBudgetAlerts(projectId: number) {
  const [budgets, costLogs] = await Promise.all([
    prisma.budget.findMany({ where: { projectId }, include: { lines: true } }),
    prisma.costLog.findMany({ where: { projectId }, select: { costType: true, amount: true } }),
  ]);
  const actualByType = new Map<string, number>();
  for (const log of costLogs) {
    const t = log.costType;
    actualByType.set(t, (actualByType.get(t) ?? 0) + log.amount.toNumber());
  }
  const created: number[] = [];
  for (const budget of budgets) {
    for (const line of budget.lines) {
      const amount = line.amount.toNumber();
      if (amount <= 0) continue;
      const actual = actualByType.get(line.costType) ?? 0;
      if (actual <= amount) continue;
      const existing = await prisma.costAlert.findFirst({
        where: { projectId, budgetLineId: line.id, resolved: false },
      });
      if (existing) continue;
      await prisma.costAlert.create({
        data: {
          projectId,
          budgetLineId: line.id,
          thresholdPct: 100,
          message: `Cost overrun on ${line.costType} — budget ${amount.toLocaleString()}, actual ${actual.toLocaleString()}`,
          resolved: false,
        },
      });
      created.push(line.id);
    }
  }
  return created;
}

export async function listCostAlerts(projectId?: number) {
  return prisma.costAlert.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: [{ resolved: "asc" }, { triggeredAt: "desc" }],
    take: 100,
  });
}

export async function resolveCostAlert(id: number) {
  return prisma.costAlert.update({ where: { id }, data: { resolved: true } });
}
