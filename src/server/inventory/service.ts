import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";

// =====================================================================
// INVENTORY: Items, Categories, Warehouses, Stock Levels, Transactions
// =====================================================================

export async function listItems(opts: { limit?: number; categoryId?: number } = {}) {
  return prisma.item.findMany({
    where: opts.categoryId ? { categoryId: opts.categoryId } : undefined,
    include: {
      category: true,
      stockLevels: { include: { warehouse: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
  });
}

export async function createItem(data: {
  code: string;
  name: string;
  categoryId?: number | null;
  unit: string;
  reorderLevel?: number;
  openingStock?: number;
  description?: string | null;
}) {
  const record = await prisma.item.create({
    data: {
      code: data.code,
      name: data.name,
      categoryId: data.categoryId ?? null,
      unit: data.unit || "EA",
      reorderLevel: data.reorderLevel ?? 0,
      openingStock: data.openingStock ?? 0,
      description: data.description,
    },
  });

  if (data.openingStock) {
    await prisma.stockTransaction.create({
      data: {
        transactionNo: `OPEN-${record.id}`,
        itemId: record.id,
        warehouseId: 1,
        type: "ADJUSTMENT",
        quantity: data.openingStock,
        notes: "Opening stock",
      },
    });
    await prisma.stockLevel.create({
      data: { itemId: record.id, warehouseId: 1, quantity: data.openingStock },
    });
  }

  await auditLog({
    action: "CREATE",
    module: MODULES.INVENTORY,
    entity: "ITEM",
    entityId: record.id,
    details: { code: record.code, name: record.name },
  });
  return record;
}

export async function listItemCategories() {
  return prisma.itemCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { items: true } } } });
}

export async function createItemCategory(data: { name: string; description?: string | null }) {
  return prisma.itemCategory.create({ data: { name: data.name, description: data.description } });
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { stockLevels: true } } },
  });
}

export async function createWarehouse(data: { code: string; name: string; location?: string | null }) {
  return prisma.warehouse.create({ data: { code: data.code, name: data.name, location: data.location } });
}

export async function stockLevels() {
  return prisma.stockLevel.findMany({
    include: { item: { include: { category: true } }, warehouse: true },
    orderBy: [{ item: { name: "asc" } }],
    take: 500,
  });
}

export async function listStockTransactions(opts: { limit?: number } = {}) {
  return prisma.stockTransaction.findMany({
    include: { item: { select: { id: true, code: true, name: true, unit: true } }, warehouse: true },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createStockAdjustment(data: {
  itemId: number;
  warehouseId: number;
  quantity: number; // signed: + adds, - removes
  notes?: string | null;
  createdById?: number | null;
}) {
  const qty = data.quantity;
  const type = qty >= 0 ? "ADJUSTMENT" : "ISSUE";

  return prisma.$transaction(async (tx) => {
    const transactionNo = `ADJ-${Date.now()}`;
    const trx = await tx.stockTransaction.create({
      data: {
        transactionNo,
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        type: type as any,
        quantity: Math.abs(qty),
        refType: "ADJUSTMENT",
        notes: data.notes,
        createdById: data.createdById ?? null,
      },
    });

    const existing = await tx.stockLevel.findUnique({
      where: { itemId_warehouseId: { itemId: data.itemId, warehouseId: data.warehouseId } },
    });
    if (existing) {
      const newQty = Math.max(0, existing.quantity.toNumber() + qty);
      await tx.stockLevel.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else if (qty > 0) {
      await tx.stockLevel.create({
        data: { itemId: data.itemId, warehouseId: data.warehouseId, quantity: qty },
      });
    }
    return trx;
  });
}
