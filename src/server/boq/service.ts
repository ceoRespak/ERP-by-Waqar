import { prisma } from "@/lib/db";
import { generateRefNo } from "@/server/refno/service";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { RateComponentType } from "@prisma/client";

// =====================================================================
// BOQ MANAGEMENT
// Multi-level BOQ items (self-referencing tree), rate analysis with
// auto-computed rates, and automatic BOQ total recalculation.
// =====================================================================

export async function listBoqs(opts: { projectId?: number; limit?: number } = {}) {
  return prisma.bOQ.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: {
      project: { select: { id: true, code: true, name: true } },
      items: { where: { parentId: null }, orderBy: { itemCode: "asc" } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createBoq(data: { projectId: number; title: string; version?: string }) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } });
  const code = await generateRefNo("BOQ", { projectCode: project?.code });

  const record = await prisma.bOQ.create({
    data: {
      projectId: data.projectId,
      code,
      title: data.title,
      version: data.version ?? "1.0",
      status: "DRAFT",
      totalAmount: 0,
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.BOQ,
    entity: "BOQ",
    entityId: record.id,
    details: { code: record.code, title: record.title },
  });
  return record;
}

export async function addBoqItem(data: {
  boqId: number;
  parentId?: number | null;
  itemCode: string;
  description: string;
  category?: string | null;
  unit: string;
  quantity: number;
  rate?: number;
}) {
  const rate = data.rate ?? 0;
  const item = await prisma.bOQItem.create({
    data: {
      boqId: data.boqId,
      parentId: data.parentId ?? null,
      itemCode: data.itemCode,
      description: data.description,
      category: data.category ?? null,
      unit: data.unit,
      quantity: data.quantity,
      rate,
      amount: data.quantity * rate,
    },
  });
  await recalculateBoqTotal(data.boqId);
  return item;
}

/**
 * Save rate analysis for a BOQ item and auto-compute:
 *   baseCost = material + labor + equipment
 *   rate     = (baseCost * (1 + overhead% + profit%)) / quantity
 * Also updates the BOQItem rate/amount and the BOQ total.
 */
export async function saveRateAnalysis(data: {
  boqItemId: number;
  overheadPct?: number;
  profitPct?: number;
  lines: { componentType: RateComponentType; description: string; quantity: number; unit: string; unitRate: number }[];
}) {
  const item = await prisma.bOQItem.findUnique({ where: { id: data.boqItemId }, include: { boq: true } });
  if (!item) throw new Error("BOQ item not found.");

  let materialCost = 0;
  let laborCost = 0;
  let equipmentCost = 0;
  const lines = data.lines.map((l) => {
    const amount = l.quantity * l.unitRate;
    if (l.componentType === "MATERIAL") materialCost += amount;
    else if (l.componentType === "LABOR") laborCost += amount;
    else equipmentCost += amount;
    return { ...l, amount };
  });

  const overheadPct = data.overheadPct ?? 0;
  const profitPct = data.profitPct ?? 0;
  const baseCost = materialCost + laborCost + equipmentCost;
  const totalWithMarks = baseCost * (1 + (overheadPct + profitPct) / 100);
  const rate = item.quantity.toNumber() > 0 ? totalWithMarks / item.quantity.toNumber() : 0;

  await prisma.rateAnalysis.upsert({
    where: { boqItemId: item.id },
    create: {
      boqItemId: item.id,
      materialCost,
      laborCost,
      equipmentCost,
      overheadPct,
      profitPct,
      rate,
      lines: { create: lines },
    },
    update: {
      materialCost,
      laborCost,
      equipmentCost,
      overheadPct,
      profitPct,
      rate,
      lines: { deleteMany: {}, create: lines },
    },
  });

  await prisma.bOQItem.update({
    where: { id: item.id },
    data: { rate, amount: item.quantity.toNumber() * rate },
  });
  await recalculateBoqTotal(item.boqId);

  return { materialCost, laborCost, equipmentCost, overheadPct, profitPct, rate, lines };
}

/** Recompute the BOQ total from all leaf item amounts. */
export async function recalculateBoqTotal(boqId: number): Promise<void> {
  const agg = await prisma.bOQItem.aggregate({ where: { boqId }, _sum: { amount: true } });
  await prisma.bOQ.update({
    where: { id: boqId },
    data: { totalAmount: agg._sum.amount?.toNumber() ?? 0 },
  });
}

export async function getBoqTree(boqId: number) {
  const items = await prisma.bOQItem.findMany({
    where: { boqId },
    include: { rateAnalysis: { include: { lines: true } }, children: { include: { children: true } } },
    orderBy: { itemCode: "asc" },
  });
  return items;
}

/** BOQ header + project + full flat item list (with rate analysis) for the editor. */
export async function getBoqDetail(boqId: number) {
  const boq = await prisma.bOQ.findUnique({
    where: { id: boqId },
    include: { project: { select: { id: true, code: true, name: true } } },
  });
  if (!boq) return null;

  const items = await prisma.bOQItem.findMany({
    where: { boqId },
    include: { rateAnalysis: { include: { lines: true } } },
    orderBy: { itemCode: "asc" },
  });

  return { boq, items };
}

/** Delete a BOQ item (its children become top-level since parentId is SetNull). */
export async function deleteBoqItem(boqId: number, itemId: number) {
  const item = await prisma.bOQItem.findFirst({ where: { id: itemId, boqId } });
  if (!item) throw new Error("BOQ item not found.");
  await prisma.bOQItem.delete({ where: { id: itemId } });
  await recalculateBoqTotal(boqId);
  return { success: true };
}
