import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES, REF_DOC_TYPES } from "@/lib/constants";
import { generateRefNo } from "@/server/refno/service";

// =====================================================================
// INVENTORY: Items, Categories, Warehouses, Stock Levels, Transactions
// =====================================================================

/**
 * Next stock transaction number via the auto-refno engine, falling back to
 * a timestamp number if the numbering config hasn't been seeded yet.
 */
async function nextTxnNo(docType: string, fallbackPrefix: string): Promise<string> {
  try {
    return await generateRefNo(docType);
  } catch {
    return `${fallbackPrefix}${Date.now()}`;
  }
}

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
    const transactionNo = await nextTxnNo(REF_DOC_TYPES.STOCK_ADJUSTMENT, "ADJ-");
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

    await auditLog({
      action: "CREATE",
      module: MODULES.INVENTORY,
      entity: "STOCK_ADJUSTMENT",
      entityId: trx.id,
      details: { transactionNo, itemId: data.itemId, warehouseId: data.warehouseId, quantity: qty },
    });
    return trx;
  });
}

/**
 * Transfer stock between two warehouses. Creates a TRANSFER_OUT at the
 * source and a TRANSFER_IN at the destination, adjusting both stock levels.
 */
export async function createStockTransfer(data: {
  fromWarehouseId: number;
  toWarehouseId: number;
  createdById?: number | null;
  notes?: string | null;
  items: { itemId: number; quantity: number }[];
}) {
  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new Error("Source and destination warehouses must be different.");
  }
  if (!data.items.length) throw new Error("At least one item line is required.");
  for (const i of data.items) {
    if (!i.itemId || i.quantity <= 0) throw new Error("Each line needs an item and a positive quantity.");
  }

  return prisma.$transaction(async (tx) => {
    const transferNo = await nextTxnNo(REF_DOC_TYPES.STOCK_TRANSFER, "TRF-");
    let line = 0;
    for (const i of data.items) {
      line += 1;
      const base = `${transferNo}-${line}`;

      const from = await tx.stockLevel.findUnique({
        where: { itemId_warehouseId: { itemId: i.itemId, warehouseId: data.fromWarehouseId } },
      });
      if (!from || from.quantity.toNumber() < i.quantity) {
        throw new Error(`Insufficient stock for item #${i.itemId} in source warehouse.`);
      }

      // Transfer out of source
      await tx.stockTransaction.create({
        data: {
          transactionNo: `${base}-OUT`,
          itemId: i.itemId,
          warehouseId: data.fromWarehouseId,
          type: "TRANSFER_OUT",
          quantity: i.quantity,
          refType: "STOCK_TRANSFER",
          refId: null,
          notes: data.notes ?? `Transfer to warehouse ${data.toWarehouseId}`,
          createdById: data.createdById ?? null,
        },
      });
      // Transfer into destination
      await tx.stockTransaction.create({
        data: {
          transactionNo: `${base}-IN`,
          itemId: i.itemId,
          warehouseId: data.toWarehouseId,
          type: "TRANSFER_IN",
          quantity: i.quantity,
          refType: "STOCK_TRANSFER",
          refId: null,
          notes: data.notes ?? `Transfer from warehouse ${data.fromWarehouseId}`,
          createdById: data.createdById ?? null,
        },
      });

      await tx.stockLevel.update({
        where: { id: from.id },
        data: { quantity: from.quantity.toNumber() - i.quantity },
      });

      const to = await tx.stockLevel.findUnique({
        where: { itemId_warehouseId: { itemId: i.itemId, warehouseId: data.toWarehouseId } },
      });
      if (to) {
        await tx.stockLevel.update({
          where: { id: to.id },
          data: { quantity: to.quantity.toNumber() + i.quantity },
        });
      } else {
        await tx.stockLevel.create({
          data: { itemId: i.itemId, warehouseId: data.toWarehouseId, quantity: i.quantity },
        });
      }
    }

    await auditLog({
      action: "CREATE",
      module: MODULES.INVENTORY,
      entity: "STOCK_TRANSFER",
      entityId: 0,
      details: { transferNo, fromWarehouseId: data.fromWarehouseId, toWarehouseId: data.toWarehouseId, lines: data.items.length },
    });
    return { transferNo };
  });
}

/** Full item detail: category, per-warehouse levels and recent movements. */
export async function getItemDetail(id: number) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      stockLevels: { include: { warehouse: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { warehouse: true, createdBy: { select: { name: true } } },
      },
    },
  });
}

export async function updateItem(
  id: number,
  data: {
    name?: string;
    categoryId?: number | null;
    unit?: string;
    reorderLevel?: number;
    description?: string | null;
    isActive?: boolean;
  }
) {
  const record = await prisma.item.update({
    where: { id },
    data: {
      name: data.name,
      categoryId: data.categoryId ?? null,
      unit: data.unit,
      reorderLevel: data.reorderLevel,
      description: data.description,
      isActive: data.isActive,
    },
  });
  await auditLog({
    action: "UPDATE",
    module: MODULES.INVENTORY,
    entity: "ITEM",
    entityId: id,
    details: { code: record.code, name: record.name, isActive: record.isActive },
  });
  return record;
}

/** On-hand value using the most recent RECEIPT unit cost per item. */
export async function getStockValuation() {
  const [levels, receipts] = await Promise.all([
    prisma.stockLevel.findMany({
      include: { item: { include: { category: true } }, warehouse: true },
      orderBy: [{ item: { name: "asc" } }],
    }),
    prisma.stockTransaction.findMany({
      where: { type: "RECEIPT" },
      orderBy: { createdAt: "desc" },
      select: { itemId: true, unitCost: true },
    }),
  ]);

  const lastCostByItem = new Map<number, number>();
  for (const r of receipts) {
    if (!lastCostByItem.has(r.itemId)) lastCostByItem.set(r.itemId, r.unitCost.toNumber());
  }

  const rows = levels.map((l) => {
    const quantity = l.quantity.toNumber();
    const unitCost = lastCostByItem.get(l.itemId) ?? 0;
    return {
      id: l.id,
      item: { id: l.item.id, code: l.item.code, name: l.item.name, unit: l.item.unit },
      category: l.item.category?.name ?? null,
      warehouse: l.warehouse.name,
      quantity,
      unitCost,
      value: quantity * unitCost,
    };
  });

  return { rows, totalValue: rows.reduce((s, r) => s + r.value, 0) };
}
