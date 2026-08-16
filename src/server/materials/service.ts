import { prisma } from "@/lib/db";
import { generateRefNo } from "@/server/refno/service";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";

// =====================================================================
// MATERIAL REQUEST & ISSUE (project-wise)
// MR (approved via workflow) -> MaterialIssue (store -> project)
// Issue posts: StockTransaction (ISSUE), StockLevel decrement,
// MR item issuedQty, and a MATERIAL CostLog for cost control.
// =====================================================================

export async function listMaterialRequests(opts: { projectId?: number; status?: string } = {}) {
  return prisma.materialRequest.findMany({
    where: {
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
      activity: { select: { id: true, wbsCode: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createMaterialRequest(data: {
  projectId: number;
  activityId?: number | null;
  requestedById?: number | null;
  requestedByName?: string | null;
  requiredDate?: string | null;
  notes?: string | null;
  items: { itemId?: number | null; description: string; quantity: number; unit: string }[];
}) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } });
  const mrNo = await generateRefNo("MATERIAL_REQUEST", { projectCode: project?.code });

  const record = await prisma.materialRequest.create({
    data: {
      mrNo,
      projectId: data.projectId,
      activityId: data.activityId ?? null,
      requestedById: data.requestedById ?? null,
      requestedByName: data.requestedByName ?? null,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      notes: data.notes,
      status: "DRAFT",
      items: {
        create: data.items.map((i) => ({
          itemId: i.itemId ?? null,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit || "EA",
        })),
      },
    },
  });
  return record;
}

export async function submitMaterialRequest(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.materialRequest.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Material request not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.MATERIAL_REQUEST,
    entityId: record.id,
    module: MODULES.PROCUREMENT,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

export async function getMaterialRequestDetail(id: number) {
  return prisma.materialRequest.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      activity: { select: { id: true, wbsCode: true, name: true } },
      items: { include: { item: { select: { id: true, code: true, name: true, unit: true } } } },
      issues: { include: { items: true }, orderBy: { issueDate: "desc" } },
    },
  });
}

/**
 * Issue materials from a warehouse to a project.
 * Decrements stock, marks MR as issued, and writes a MATERIAL cost log.
 */
export async function issueMaterials(data: {
  projectId: number;
  requestId?: number | null;
  warehouseId?: number | null;
  issuedById?: number | null;
  issuedByName?: string | null;
  notes?: string | null;
  items: { itemId?: number | null; quantity: number }[];
}) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { code: true } });
  const issueNo = await generateRefNo("GRN", { projectCode: project?.code }); // reuse serial family, or a dedicated config

  return prisma.$transaction(async (tx) => {
    const issue = await tx.materialIssue.create({
      data: {
        issueNo,
        projectId: data.projectId,
        requestId: data.requestId ?? null,
        warehouseId: data.warehouseId ?? null,
        issuedById: data.issuedById ?? null,
        notes: data.notes,
        items: {
          create: data.items.map((i) => ({ itemId: i.itemId ?? null, quantity: i.quantity })),
        },
      },
    });

    for (const i of data.items) {
      if (!i.itemId) continue;
      const warehouseId = data.warehouseId ?? 1;

      // Decrement stock level
      const level = await tx.stockLevel.findUnique({
        where: { itemId_warehouseId: { itemId: i.itemId, warehouseId } },
      });
      if (level) {
        const newQty = Math.max(0, level.quantity.toNumber() - i.quantity);
        await tx.stockLevel.update({ where: { id: level.id }, data: { quantity: newQty } });
      }

      // Stock transaction (ISSUE)
      await tx.stockTransaction.create({
        data: {
          transactionNo: `${issueNo}-${i.itemId ?? "x"}`,
          itemId: i.itemId,
          warehouseId,
          type: "ISSUE",
          quantity: i.quantity,
          refType: "MATERIAL_ISSUE",
          refId: issue.id,
          notes: `Issued to project ${project?.code ?? data.projectId}`,
          createdById: data.issuedById ?? null,
        },
      });

      // Cost log for budget-vs-actual tracking
      await tx.costLog.create({
        data: {
          projectId: data.projectId,
          date: new Date(),
          costType: "MATERIAL",
          description: `Material issue ${issueNo}`,
          amount: 0, // extend with valuation (unit cost) as needed
          refType: "MR",
          refId: data.requestId ?? issue.id,
        },
      });
    }

    // Mark MR as issued + update per-line issuedQty
    if (data.requestId) {
      const req = await tx.materialRequest.findUnique({
        where: { id: data.requestId },
        include: { items: true },
      });
      if (req && req.status !== "ISSUED") {
        await tx.materialRequest.update({ where: { id: req.id }, data: { status: "ISSUED" } });
      }
      for (const i of data.items) {
        if (!i.itemId) continue;
        const reqItem = req?.items.find((ri) => ri.itemId === i.itemId);
        if (!reqItem) continue;
        await tx.materialRequestItem.update({
          where: { id: reqItem.id },
          data: { issuedQty: reqItem.issuedQty.toNumber() + i.quantity },
        });
      }
    }

    return issue;
  });
}

export async function listMaterialIssues(opts: { projectId?: number } = {}) {
  return prisma.materialIssue.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: {
      project: { select: { id: true, code: true, name: true } },
      request: { select: { id: true, mrNo: true, status: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      items: { include: { item: { select: { id: true, code: true, name: true, unit: true } } } },
    },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
}

// Keep audit import used
export async function _auditLogIssue(issueId: number, userId?: number | null) {
  await auditLog({
    userId,
    action: "CREATE",
    module: MODULES.INVENTORY,
    entity: "MATERIAL_ISSUE",
    entityId: issueId,
  });
}
