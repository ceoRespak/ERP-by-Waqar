import { prisma } from "@/lib/db";
import { nextDocNo } from "@/server/docno";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";

// =====================================================================
// PROCUREMENT: Purchase Requisition -> Purchase Order -> GRN
// =====================================================================

export async function listRequisitions(opts: { limit?: number; status?: string } = {}) {
  return prisma.purchaseRequisition.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      items: true,
      department: true,
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createRequisition(data: {
  title: string;
  requestedById: number;
  requestedByName: string;
  departmentId?: number | null;
  projectId?: number | null;
  requiredDate?: string | null;
  notes?: string | null;
  items: { itemId?: number | null; description: string; quantity: number; unit: string; estimatedCost: number }[];
}) {
  const prNo = await nextDocNo("prNo", "PR", (args) => prisma.purchaseRequisition.findFirst(args as any));
  const record = await prisma.purchaseRequisition.create({
    data: {
      prNo,
      title: data.title,
      requestedById: data.requestedById,
      requestedByName: data.requestedByName,
      departmentId: data.departmentId ?? null,
      projectId: data.projectId ?? null,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      notes: data.notes,
      status: "DRAFT",
      items: {
        create: data.items.map((i) => ({
          itemId: i.itemId ?? null,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit || "EA",
          estimatedCost: i.estimatedCost || 0,
        })),
      },
    },
  });

  await auditLog({
    userId: data.requestedById,
    userName: data.requestedByName,
    action: "CREATE",
    module: MODULES.PROCUREMENT,
    entity: "PURCHASE_REQUISITION",
    entityId: record.id,
    details: { prNo },
  });

  return record;
}

export async function submitRequisition(params: {
  id: number;
  userId: number;
  userName: string;
}) {
  const record = await prisma.purchaseRequisition.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Requisition not found.");
  if (record.status !== "DRAFT" && record.status !== "REJECTED") {
    throw new Error("Only draft or rejected requisitions can be submitted.");
  }
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.PURCHASE_REQUISITION,
    entityId: record.id,
    module: MODULES.PROCUREMENT,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------
export async function listPurchaseOrders(opts: { limit?: number; status?: string } = {}) {
  return prisma.purchaseOrder.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      items: true,
      vendor: { select: { id: true, name: true } },
      requisition: { select: { id: true, prNo: true } },
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createPurchaseOrder(data: {
  vendorId?: number | null;
  vendorName: string;
  requisitionId?: number | null;
  projectId?: number | null;
  expectedDelivery?: string | null;
  terms?: string | null;
  items: {
    itemId?: number | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}) {
  const poNo = await nextDocNo("poNo", "PO", (args) => prisma.purchaseOrder.findFirst(args as any));

  let subtotal = 0;
  let taxAmount = 0;
  const lineItems = data.items.map((i) => {
    const lineTotal = i.quantity * i.unitPrice;
    const tax = (lineTotal * (i.taxRate || 0)) / 100;
    subtotal += lineTotal;
    taxAmount += tax;
    return {
      itemId: i.itemId ?? null,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxRate: i.taxRate || 0,
      lineTotal,
    };
  });

  const total = subtotal + taxAmount;

  const record = await prisma.purchaseOrder.create({
    data: {
      poNo,
      vendorId: data.vendorId ?? null,
      vendorName: data.vendorName,
      requisitionId: data.requisitionId ?? null,
      projectId: data.projectId ?? null,
      expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
      terms: data.terms,
      subtotal,
      taxAmount,
      total,
      status: "DRAFT",
      items: { create: lineItems },
    },
  });

  return record;
}

export async function submitPurchaseOrder(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Purchase order not found.");
  if (record.status !== "DRAFT" && record.status !== "REJECTED") {
    throw new Error("Only draft purchase orders can be submitted.");
  }
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.PURCHASE_ORDER,
    entityId: record.id,
    module: MODULES.PROCUREMENT,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// GRN (Goods Receipt Note) — posts to inventory on receipt
// ---------------------------------------------------------------------
export async function listGrns(opts: { limit?: number } = {}) {
  return prisma.gRN.findMany({
    include: {
      po: { select: { id: true, poNo: true, vendorName: true } },
      warehouse: { select: { id: true, name: true } },
      items: { include: { item: { select: { id: true, code: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createGrn(data: {
  poId: number;
  warehouseId?: number | null;
  receivedById?: number | null;
  receivedByName?: string | null;
  notes?: string | null;
  items: { poItemId: number; itemId?: number | null; receivedQty: number }[];
}) {
  const grnNo = await nextDocNo("grnNo", "GRN", (args) => prisma.gRN.findFirst(args as any));

  const record = await prisma.$transaction(async (tx) => {
    const grn = await tx.gRN.create({
      data: {
        grnNo,
        poId: data.poId,
        warehouseId: data.warehouseId ?? null,
        receivedById: data.receivedById ?? null,
        notes: data.notes,
        status: "POSTED",
        items: {
          create: data.items.map((i) => ({
            poItemId: i.poItemId,
            itemId: i.itemId ?? null,
            receivedQty: i.receivedQty,
          })),
        },
      },
    });

    // Update PO item received qty and create stock transactions
    for (const i of data.items) {
      if (!i.itemId) continue;
      const poItem = await tx.pOItem.findUnique({ where: { id: i.poItemId } });
      if (!poItem) continue;
      const newReceived = poItem.receivedQty.toNumber() + i.receivedQty;
      await tx.pOItem.update({
        where: { id: i.poItemId },
        data: { receivedQty: newReceived },
      });

      // Stock in
      await tx.stockTransaction.create({
        data: {
          transactionNo: `${grnNo}-${i.poItemId}`,
          itemId: i.itemId,
          warehouseId: data.warehouseId ?? 1,
          type: "RECEIPT",
          quantity: i.receivedQty,
          unitCost: poItem.unitPrice,
          refType: "GRN",
          refId: grn.id,
          notes: `Goods received against PO`,
          createdById: data.receivedById ?? null,
        },
      });

      // Upsert stock level
      const existing = await tx.stockLevel.findUnique({
        where: {
          itemId_warehouseId: { itemId: i.itemId, warehouseId: data.warehouseId ?? 1 },
        },
      });
      if (existing) {
        await tx.stockLevel.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity.toNumber() + i.receivedQty },
        });
      } else {
        await tx.stockLevel.create({
          data: { itemId: i.itemId, warehouseId: data.warehouseId ?? 1, quantity: i.receivedQty },
        });
      }
    }

    // Recompute PO status
    const poItems = await tx.pOItem.findMany({ where: { poId: data.poId } });
    const allReceived = poItems.every((p) => p.receivedQty.toNumber() >= p.quantity.toNumber());
    const anyReceived = poItems.some((p) => p.receivedQty.toNumber() > 0);
    await tx.purchaseOrder.update({
      where: { id: data.poId },
      data: { status: allReceived ? "COMPLETED" : anyReceived ? "PARTIALLY_RECEIVED" : "APPROVED" },
    });

    return grn;
  });

  await auditLog({
    userId: data.receivedById,
    userName: data.receivedByName,
    action: "CREATE",
    module: MODULES.INVENTORY,
    entity: "GRN",
    entityId: record.id,
    details: { grnNo },
  });

  return record;
}
