import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import {
  APPROVAL_ENTITY_TYPES,
  ENTITY_STATUS_MAP,
  type ApprovalEntityType,
} from "@/lib/constants";

// =====================================================================
// Generic Approval Workflow Engine
//
// A transaction (e.g. Purchase Requisition, Check Request, Leave) is
// linked to an ApprovalRequest. The engine:
//   1. submitForApproval  -> creates the request, starts at step 1
//   2. approveStep        -> advances to next step; on last step APPROVED
//   3. rejectStep         -> REJECTED (whole flow stops)
//
// Steps are assigned to a Role OR a specific User. The chain for an
// entity type is chosen by { entityType + module + isActive }.
// =====================================================================

type Approver = { id: number; name: string; roles: { role: { name: string } }[] };

export async function getApprovalChain(entityType: string, module: string) {
  return prisma.approvalChain.findFirst({
    where: { entityType, module, isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Whether a user may act on the given step (by role or by direct assignment). */
function canActOnStep(step: { roleId: number | null; userId: number | null }, user: Approver): boolean {
  if (step.userId != null && step.userId === user.id) return true;
  if (step.roleId != null) {
    const roleIds = new Set(user.roles.map((r) => r.role.name));
    // We match on role name — resolve below in getApproverRoles
    return (step as unknown as { roleName?: string }).roleName != null
      ? roleIds.has((step as unknown as { roleName: string }).roleName as string)
      : false;
  }
  return false;
}

/** Fetch the user (with role names) needed for step checks. */
async function getApprover(userId: number): Promise<Approver | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return null;
  return { id: user.id, name: user.name, roles: user.roles };
}

async function updateEntityStatus(
  entityType: ApprovalEntityType,
  entityId: number,
  status: string
): Promise<void> {
  const map = ENTITY_STATUS_MAP[entityType];
  if (!map) return;
  const model = (prisma as any)[map.model];
  if (!model || typeof model.update !== "function") return;
  await model.update({
    where: { id: entityId },
    data: { [map.statusField]: status },
  });
}

// ---------------------------------------------------------------------
// SUBMIT
// ---------------------------------------------------------------------
export async function submitForApproval(params: {
  entityType: ApprovalEntityType;
  entityId: number;
  module: string;
  submittedById?: number;
  submittedByName?: string;
  createdById?: number;
  createdByName?: string;
}) {
  const chain = await getApprovalChain(params.entityType, params.module);
  if (!chain) {
    // No chain configured -> auto-approve (single step, no approver)
    const request = await prisma.approvalRequest.create({
      data: {
        module: params.module,
        entityType: params.entityType,
        entityId: params.entityId,
        status: "APPROVED",
        currentStep: 1,
        submittedById: params.submittedById ?? null,
        submittedByName: params.submittedByName ?? null,
        submittedAt: new Date(),
        decidedAt: new Date(),
      },
    });
    await updateEntityStatus(params.entityType, params.entityId, "APPROVED");
    return request;
  }

  if (chain.steps.length === 0) {
    const request = await prisma.approvalRequest.create({
      data: {
        module: params.module,
        entityType: params.entityType,
        entityId: params.entityId,
        chainId: chain.id,
        status: "APPROVED",
        currentStep: 1,
        submittedById: params.submittedById ?? null,
        submittedByName: params.submittedByName ?? null,
        submittedAt: new Date(),
        decidedAt: new Date(),
      },
    });
    await updateEntityStatus(params.entityType, params.entityId, "APPROVED");
    return request;
  }

  const request = await prisma.approvalRequest.create({
    data: {
      module: params.module,
      entityType: params.entityType,
      entityId: params.entityId,
      chainId: chain.id,
      status: "PENDING",
      currentStep: 1,
      createdById: params.createdById ?? params.submittedById ?? null,
      createdByName: params.createdByName ?? params.submittedByName ?? null,
      submittedById: params.submittedById ?? null,
      submittedByName: params.submittedByName ?? null,
      submittedAt: new Date(),
    },
  });

  await prisma.approvalAction.create({
    data: {
      requestId: request.id,
      stepOrder: 0,
      action: "SUBMIT",
      userId: params.submittedById ?? null,
      userName: params.submittedByName ?? null,
      comment: "Submitted for approval",
    },
  });

  await updateEntityStatus(params.entityType, params.entityId, "PENDING");
  return request;
}

// ---------------------------------------------------------------------
// APPROVE (advance one step)
// ---------------------------------------------------------------------
export async function approveStep(params: {
  requestId: number;
  userId: number;
  userName: string;
  comment?: string;
}) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: params.requestId },
    include: { chain: { include: { steps: { orderBy: { stepOrder: "asc" } } } } },
  });
  if (!request || request.status !== "PENDING") {
    throw new Error("Approval request is not pending.");
  }
  const steps = request.chain?.steps ?? [];
  const step = steps.find((s) => s.stepOrder === request.currentStep);
  if (!step) throw new Error("Approval step not found.");

  const approver = await getApprover(params.userId);
  if (!approver) throw new Error("Approver not found.");
  if (!canActOnStep(step, approver)) {
    throw new Error("You are not authorized to approve this step.");
  }

  await prisma.approvalAction.create({
    data: {
      requestId: request.id,
      stepOrder: step.stepOrder,
      action: "APPROVE",
      userId: params.userId,
      userName: params.userName,
      comment: params.comment ?? null,
    },
  });

  const isLastStep = step.stepOrder >= Math.max(...steps.map((s) => s.stepOrder));
  const nextStatus = isLastStep ? "APPROVED" : "PENDING";
  const nextStep = isLastStep ? request.currentStep : request.currentStep + 1;

  const updated = await prisma.approvalRequest.update({
    where: { id: request.id },
    data: {
      status: nextStatus,
      currentStep: nextStep,
      decidedAt: isLastStep ? new Date() : null,
    },
  });

  if (isLastStep) {
    const map = ENTITY_STATUS_MAP[request.entityType as ApprovalEntityType];
    if (map) {
      await updateEntityStatus(request.entityType as ApprovalEntityType, request.entityId, map.approvedStatus);
    }
  }

  await auditLog({
    userId: params.userId,
    userName: params.userName,
    action: "APPROVE",
    module: request.module,
    entity: request.entityType,
    entityId: request.entityId,
    details: { requestId: request.id, step: step.stepOrder, comment: params.comment ?? null },
  });

  return updated;
}

// ---------------------------------------------------------------------
// REJECT (stop the flow)
// ---------------------------------------------------------------------
export async function rejectStep(params: {
  requestId: number;
  userId: number;
  userName: string;
  comment?: string;
}) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: params.requestId },
    include: { chain: { include: { steps: { orderBy: { stepOrder: "asc" } } } } },
  });
  if (!request || request.status !== "PENDING") {
    throw new Error("Approval request is not pending.");
  }
  const steps = request.chain?.steps ?? [];
  const step = steps.find((s) => s.stepOrder === request.currentStep);
  if (!step) throw new Error("Approval step not found.");

  const approver = await getApprover(params.userId);
  if (!approver) throw new Error("Approver not found.");
  if (!canActOnStep(step, approver)) {
    throw new Error("You are not authorized to reject this step.");
  }

  await prisma.approvalAction.create({
    data: {
      requestId: request.id,
      stepOrder: step.stepOrder,
      action: "REJECT",
      userId: params.userId,
      userName: params.userName,
      comment: params.comment ?? null,
    },
  });

  const updated = await prisma.approvalRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED", decidedAt: new Date() },
  });

  const map = ENTITY_STATUS_MAP[request.entityType as ApprovalEntityType];
  if (map) {
    await updateEntityStatus(request.entityType as ApprovalEntityType, request.entityId, map.rejectedStatus);
  }

  await auditLog({
    userId: params.userId,
    userName: params.userName,
    action: "REJECT",
    module: request.module,
    entity: request.entityType,
    entityId: request.entityId,
    details: { requestId: request.id, step: step.stepOrder, comment: params.comment ?? null },
  });

  return updated;
}

// ---------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------

/** Steps that a user is allowed to act on (by role or direct assignment). */
export async function approvableStepsForUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });
  if (!user) return [];
  const roleIds = user.roles.map((r) => r.roleId);
  const byRole = await prisma.approvalStep.findMany({ where: { roleId: { in: roleIds } } });
  const byUser = await prisma.approvalStep.findMany({ where: { userId } });
  return [...byRole, ...byUser];
}

/**
 * All PENDING approval requests where the current step can be acted on
 * by the given user (matches role or direct assignment).
 */
export async function pendingApprovalsForUser(userId: number, limit = 100) {
  const steps = await approvableStepsForUser(userId);
  const chainIds = [...new Set(steps.map((s) => s.chainId))];
  const stepOrders = [...new Set(steps.map((s) => s.stepOrder))];

  const requests = await prisma.approvalRequest.findMany({
    where: {
      status: "PENDING",
      chainId: { in: chainIds.length ? chainIds : [-1] },
      currentStep: { in: stepOrders.length ? stepOrders : [-1] },
    },
    include: {
      chain: true,
      actions: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return requests;
}

/** Full approval history for a transaction. */
export async function approvalForEntity(entityType: string, entityId: number) {
  return prisma.approvalRequest.findFirst({
    where: { entityType, entityId },
    include: {
      chain: { include: { steps: { orderBy: { stepOrder: "asc" }, include: { role: true, user: true } } } },
      actions: { orderBy: { createdAt: "asc" }, include: { user: true } },
    },
  });
}

export { APPROVAL_ENTITY_TYPES };
