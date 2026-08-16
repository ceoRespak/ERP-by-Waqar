import { prisma } from "@/lib/db";
import { generateRefNo } from "@/server/refno/service";
import { submitForApproval } from "@/server/approval/service";
import { checkBudgetAlerts } from "@/server/budget/service";
import { APPROVAL_ENTITY_TYPES, MODULES, type CostType } from "@/lib/constants";
import { auditLog } from "@/server/audit";

// =====================================================================
// COST CONTROL — cost centers, cost ledger (CostLog), variation orders
// (VO) and interim payment certificates (IPC). VO/IPC run through the
// approval workflow and get auto reference numbers.
// =====================================================================

// ---------------------------------------------------------------------
// Cost centers
// ---------------------------------------------------------------------
export async function listCostCenters(projectId?: number) {
  return prisma.costCenter.findMany({
    where: projectId ? { projectId } : {},
    include: { children: true, _count: { select: { logs: true } } },
    orderBy: { code: "asc" },
  });
}

export async function createCostCenter(data: { projectId?: number | null; code: string; name: string; parentId?: number | null }) {
  const record = await prisma.costCenter.create({
    data: {
      projectId: data.projectId ?? null,
      code: data.code,
      name: data.name,
      parentId: data.parentId ?? null,
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.COST, entity: "COST_CENTER", entityId: record.id, details: { code: record.code } });
  return record;
}

// ---------------------------------------------------------------------
// Cost ledger
// ---------------------------------------------------------------------
export async function listCostLogs(projectId?: number) {
  return prisma.costLog.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
      costCenter: { select: { id: true, code: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 300,
  });
}

export async function createCostLog(data: {
  projectId: number;
  costCenterId?: number | null;
  date?: string | null;
  costType?: CostType;
  description: string;
  amount: number;
  refType?: string | null;
  refId?: number | null;
}) {
  const record = await prisma.costLog.create({
    data: {
      projectId: data.projectId,
      costCenterId: data.costCenterId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      costType: data.costType ?? "MATERIAL",
      description: data.description,
      amount: data.amount || 0,
      refType: data.refType ?? null,
      refId: data.refId ?? null,
    },
  });
  // Re-run the budget alert check now that the ledger has moved.
  await checkBudgetAlerts(data.projectId).catch(() => {});
  await auditLog({
    action: "CREATE",
    module: MODULES.COST,
    entity: "COST_LOG",
    entityId: record.id,
    details: { projectId: data.projectId, amount: record.amount.toNumber(), costType: record.costType },
  });
  return record;
}

// ---------------------------------------------------------------------
// Variation orders (approval workflow)
// ---------------------------------------------------------------------
export async function listVariationOrders(projectId?: number) {
  return prisma.variationOrder.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createVariationOrder(data: {
  projectId: number;
  title: string;
  description?: string | null;
  amount: number;
}) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } });
  const voNo = await generateRefNo("VARIATION_ORDER", { projectCode: project?.code });
  const record = await prisma.variationOrder.create({
    data: {
      voNo,
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      amount: data.amount || 0,
      status: "DRAFT",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.COST, entity: "VARIATION_ORDER", entityId: record.id, details: { voNo } });
  return record;
}

export async function submitVariationOrder(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.variationOrder.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Variation order not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.VARIATION_ORDER,
    entityId: record.id,
    module: MODULES.COST,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Interim payment certificates (IPC)
// ---------------------------------------------------------------------
export async function listIpcs(projectId?: number) {
  return prisma.iPC.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, code: true, name: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getIpcDetail(id: number) {
  return prisma.iPC.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      lines: {
        include: { boqItem: { select: { id: true, itemCode: true, description: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
}

export async function createIpc(data: {
  projectId: number;
  period?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  retention?: number;
  deductions?: number;
  lines: { boqItemId?: number | null; description: string; currentQty: number; rate: number }[];
}) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } });
  const ipcNo = await generateRefNo("IPC", { projectCode: project?.code });
  const grossValue = data.lines.reduce((s, l) => s + (l.currentQty || 0) * (l.rate || 0), 0);
  const retention = data.retention ?? 0;
  const deductions = data.deductions ?? 0;
  const netValue = grossValue - retention - deductions;

  const record = await prisma.iPC.create({
    data: {
      ipcNo,
      projectId: data.projectId,
      period: data.period ?? null,
      fromDate: data.fromDate ? new Date(data.fromDate) : null,
      toDate: data.toDate ? new Date(data.toDate) : null,
      grossValue,
      retention,
      deductions,
      netValue,
      status: "DRAFT",
      lines: {
        create: data.lines.map((l) => ({
          boqItemId: l.boqItemId ?? null,
          description: l.description,
          currentQty: l.currentQty || 0,
          rate: l.rate || 0,
          amount: (l.currentQty || 0) * (l.rate || 0),
        })),
      },
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.COST, entity: "IPC", entityId: record.id, details: { ipcNo, netValue } });
  return record;
}

/** Recompute gross/net after a line change. */
export async function recomputeIpc(ipcId: number) {
  const [ipc, lines] = await Promise.all([
    prisma.iPC.findUnique({ where: { id: ipcId } }),
    prisma.iPCLine.findMany({ where: { ipcId } }),
  ]);
  if (!ipc) throw new Error("IPC not found.");
  const grossValue = lines.reduce((s, l) => s + l.amount.toNumber(), 0);
  const netValue = grossValue - ipc.retention.toNumber() - ipc.deductions.toNumber();
  return prisma.iPC.update({ where: { id: ipcId }, data: { grossValue, netValue } });
}

export async function addIpcLine(data: { ipcId: number; boqItemId?: number | null; description: string; currentQty: number; rate: number }) {
  const line = await prisma.iPCLine.create({
    data: {
      ipcId: data.ipcId,
      boqItemId: data.boqItemId ?? null,
      description: data.description,
      currentQty: data.currentQty || 0,
      rate: data.rate || 0,
      amount: (data.currentQty || 0) * (data.rate || 0),
    },
  });
  await recomputeIpc(data.ipcId);
  return line;
}

export async function deleteIpcLine(lineId: number) {
  const line = await prisma.iPCLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("IPC line not found.");
  await prisma.iPCLine.delete({ where: { id: lineId } });
  await recomputeIpc(line.ipcId);
  return line;
}

export async function submitIpc(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.iPC.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("IPC not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.IPC,
    entityId: record.id,
    module: MODULES.COST,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Dashboard aggregates for the cost page
// ---------------------------------------------------------------------
export async function getCostDashboard(projectId: number) {
  const [budgetAgg, actualAgg, alerts, voAgg, ipcAgg] = await Promise.all([
    prisma.budget.aggregate({ where: { projectId }, _sum: { totalAmount: true } }),
    prisma.costLog.aggregate({ where: { projectId }, _sum: { amount: true } }),
    prisma.costAlert.count({ where: { projectId, resolved: false } }),
    prisma.variationOrder.aggregate({ where: { projectId }, _sum: { amount: true } }),
    prisma.iPC.aggregate({ where: { projectId, status: { in: ["APPROVED", "CERTIFIED"] } }, _sum: { netValue: true } }),
  ]);
  const budgetTotal = budgetAgg._sum.totalAmount?.toNumber() ?? 0;
  const actualCost = actualAgg._sum.amount?.toNumber() ?? 0;
  return {
    budgetTotal,
    actualCost,
    variance: budgetTotal - actualCost,
    openAlerts: alerts,
    variationTotal: voAgg._sum.amount?.toNumber() ?? 0,
    certifiedIpc: ipcAgg._sum.netValue?.toNumber() ?? 0,
  };
}
