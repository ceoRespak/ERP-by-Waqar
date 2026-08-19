import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import { daysBetween } from "@/server/hr/helpers";
import { createNotification, notifyUsersByRole } from "@/server/hr/notifications";

// =====================================================================
// HR LEAVES — faithful port of respakHRM leaveController.js + leaveTypeController.js
// =====================================================================

// ---------------------------------------------------------------------
// Leave Types
// ---------------------------------------------------------------------
export async function listLeaveTypes() {
  return prisma.leaveTypeConfig.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createLeaveType(data: { code: string; name: string; description?: string; defaultTotal?: number; isPaid?: boolean; requiresDocument?: boolean; color?: string; sortOrder?: number }) {
  const record = await prisma.leaveTypeConfig.create({
    data: {
      code: data.code.toLowerCase(),
      name: data.name,
      description: data.description ?? "",
      defaultTotal: data.defaultTotal ?? 0,
      isPaid: data.isPaid ?? true,
      requiresDocument: data.requiresDocument ?? false,
      color: data.color ?? "info",
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });
  // respakHRM: creating a leave type auto-propagates a balance entry to every active employee
  const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  if (employees.length) {
    await prisma.leaveBalance.createMany({
      data: employees.map((e) => ({ employeeId: e.id, leaveTypeConfigId: record.id, total: record.defaultTotal, used: 0 })),
      skipDuplicates: true,
    });
  }
  return record;
}

export async function updateLeaveType(id: number, data: { name?: string; description?: string; defaultTotal?: number; isPaid?: boolean; requiresDocument?: boolean; color?: string; sortOrder?: number; isActive?: boolean }) {
  return prisma.leaveTypeConfig.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      defaultTotal: data.defaultTotal,
      isPaid: data.isPaid,
      requiresDocument: data.requiresDocument,
      color: data.color,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

/** Delete pulls the leave type from every employee balance (respakHRM). */
export async function deleteLeaveType(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.leaveBalance.deleteMany({ where: { leaveTypeConfigId: id } });
    await tx.leaveTypeConfig.delete({ where: { id } });
  });
  return { ok: true };
}

export async function reorderLeaveTypes(ids: number[]) {
  for (let i = 0; i < ids.length; i++) {
    await prisma.leaveTypeConfig.update({ where: { id: ids[i] }, data: { sortOrder: i } });
  }
  return { ok: true };
}

// ---------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------
export async function listLeaveRequests(opts: { limit?: number; status?: string; employeeId?: number; from?: string; to?: string } = {}) {
  return prisma.leaveRequest.findMany({
    where: {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
      ...(opts.from || opts.to
        ? {
            fromDate: {
              ...(opts.from ? { gte: new Date(opts.from) } : {}),
              ...(opts.to ? { lte: new Date(opts.to) } : {}),
            },
          }
        : {}),
    },
    include: {
      employee: { select: { id: true, empCode: true, firstName: true, lastName: true, currentProject: { select: { id: true, name: true, projectManager: { select: { userId: true } } } } } },
      leaveTypeConfig: { select: { id: true, code: true, name: true, color: true } },
      approvedByPM: { select: { id: true, name: true } },
      approvedByHR: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function getLeaveRequestDetail(id: number) {
  return prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { currentProject: { include: { projectManager: { include: { user: { select: { id: true, name: true } } } } } } } },
      leaveTypeConfig: true,
      approvedByPM: { select: { id: true, name: true } },
      approvedByHR: { select: { id: true, name: true } },
      rejectedBy: { select: { id: true, name: true } },
    },
  });
}

export async function employeeLeaveBalances(employeeId: number) {
  return prisma.leaveBalance.findMany({
    where: { employeeId },
    include: { leaveType: true },
    orderBy: { leaveType: { sortOrder: "asc" } },
  });
}

/** Does the user manage the project the employee currently works at? */
async function isConcernedPMForEmployee(userId: number, employee: { currentProject: { projectManager: { userId: number | null } | null } | null }): Promise<boolean> {
  const pm = employee.currentProject?.projectManager;
  if (pm?.userId && pm.userId === userId) return true;
  // respakHRM: if the employee has no project/PM, any PM may approve
  return !employee.currentProject || !pm?.userId;
}

export async function applyLeave(data: {
  employeeId: number;
  leaveType: string; // leave-type code
  fromDate: string;
  toDate: string;
  reason: string;
  contactDuringLeave?: string | null;
  alternateArrangements?: string | null;
  supportingDocument?: string | null;
  isHalfDay?: boolean;
  appliedById?: number | null;
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
    include: { currentProject: { include: { projectManager: { select: { userId: true } } } }, leaveBalances: { include: { leaveType: true } } },
  });
  if (!employee) throw new Error("Employee not found.");

  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const totalDays = data.isHalfDay ? 0.5 : daysBetween(from, to);

  const leaveTypeConfig = await prisma.leaveTypeConfig.findUnique({ where: { code: data.leaveType } });
  if (!leaveTypeConfig) throw new Error(`Unknown leave type "${data.leaveType}".`);

  // Balance check (skip for unpaid)
  const balance = employee.leaveBalances.find((lb) => lb.leaveType.code === data.leaveType);
  if (leaveTypeConfig.isPaid) {
    if (!balance) throw new Error(`No leave balance configured for ${data.leaveType}.`);
    const available = balance.total.toNumber() - balance.used.toNumber();
    if (available < totalDays) throw new Error(`Insufficient leave balance for ${leaveTypeConfig.name} (${available} available, ${totalDays} requested).`);
  }

  // Overlap guard (respakHRM: existing non-rejected/cancelled overlapping leaves)
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: data.employeeId,
      status: { notIn: ["REJECTED", "CANCELLED"] },
      fromDate: { lte: to },
      toDate: { gte: from },
    },
  });
  if (overlap) throw new Error("This employee already has a leave request overlapping these dates.");

  const record = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      leaveTypeConfigId: leaveTypeConfig.id,
      fromDate: from,
      toDate: to,
      days: totalDays,
      reason: data.reason,
      contactDuringLeave: data.contactDuringLeave ?? null,
      alternateArrangements: data.alternateArrangements ?? null,
      supportingDocument: data.supportingDocument ?? null,
      isHalfDay: data.isHalfDay ?? false,
      isPaid: leaveTypeConfig.isPaid,
      status: "PENDING",
      currentApprovalStep: "pm",
    },
  });

  // Notify the employee's current-project PM
  const pmUserId = employee.currentProject?.projectManager?.userId;
  if (pmUserId) {
    await createNotification({
      recipientId: pmUserId,
      senderId: data.appliedById ?? null,
      type: "leave_applied",
      title: "Leave application",
      message: `${employee.firstName} ${employee.lastName} applied for ${totalDays} day(s) of ${leaveTypeConfig.name}.`,
      relatedModel: "Leave",
      relatedId: record.id,
    });
  }
  await notifyUsersByRole(["HR_MANAGER", "ADMIN"], {
    type: "leave_applied",
    title: "Leave application",
    message: `${employee.firstName} ${employee.lastName} applied for ${totalDays} day(s) of ${leaveTypeConfig.name}.`,
    relatedModel: "Leave",
    relatedId: record.id,
  });

  await auditLog({ userId: data.appliedById, action: "CREATE", module: MODULES.HR, entity: "LEAVE_REQUEST", entityId: record.id, details: { leaveType: data.leaveType, days: totalDays } });
  return record;
}

export async function approveLeaveByPM(id: number, userId: number, remarks?: string | null) {
  const record = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { include: { currentProject: { include: { projectManager: { select: { userId: true } } } } } } },
  });
  if (!record) throw new Error("Leave request not found.");
  if (record.status !== "PENDING" || record.currentApprovalStep !== "pm") throw new Error("This leave can no longer be PM-approved.");
  if (!(await isConcernedPMForEmployee(userId, record.employee))) throw new Error("You are not the project manager for this employee's project.");

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "APPROVED_BY_PM", currentApprovalStep: "hr", approvedByPMId: userId, pmApprovalDate: new Date(), pmRemarks: remarks ?? null },
  });
  await notifyUsersByRole(["HR_MANAGER", "ADMIN"], {
    type: "leave_approved",
    title: "Leave pre-approved",
    message: `PM approved leave for ${record.employee.firstName} ${record.employee.lastName} — awaiting HR.`,
    relatedModel: "Leave",
    relatedId: id,
  });
  return updated;
}

export async function approveLeaveByHR(id: number, userId: number, remarks?: string | null) {
  const record = await prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
  if (!record) throw new Error("Leave request not found.");
  if (record.status !== "APPROVED_BY_PM" || record.currentApprovalStep !== "hr") throw new Error("This leave can no longer be HR-approved.");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED_BY_HR", approvedByHRId: userId, hrApprovalDate: new Date(), hrRemarks: remarks ?? null },
    });
    // Decrement balance only when paid (respakHRM)
    if (u.isPaid) {
      const balance = await tx.leaveBalance.findFirst({
        where: { employeeId: u.employeeId, leaveTypeConfigId: u.leaveTypeConfigId ?? undefined },
      });
      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { used: balance.used.toNumber() + u.days.toNumber() },
        });
      }
    }
    return u;
  });

  if (record.employee.userId) {
    await createNotification({
      recipientId: record.employee.userId,
      type: "leave_approved",
      title: "Leave approved",
      message: `Your ${record.days} day(s) leave request was fully approved.`,
      relatedModel: "Leave",
      relatedId: id,
    });
  }
  return updated;
}

export async function rejectLeave(id: number, userId: number, reason: string, userRole: string) {
  const record = await prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
  if (!record) throw new Error("Leave request not found.");
  if (["APPROVED_BY_HR", "REJECTED", "CANCELLED"].includes(record.status)) throw new Error("This leave can no longer be rejected.");

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason, rejectedById: userId },
  });
  if (record.employee.userId) {
    await createNotification({
      recipientId: record.employee.userId,
      type: "leave_rejected",
      title: "Leave rejected",
      message: `Your leave request was rejected${reason ? `: ${reason}` : ""}.`,
      relatedModel: "Leave",
      relatedId: id,
    });
  }
  return updated;
}

export async function cancelLeave(id: number, userId: number) {
  const record = await prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
  if (!record) throw new Error("Leave request not found.");
  if (record.status !== "PENDING") throw new Error("Only a pending leave can be cancelled.");
  const updated = await prisma.leaveRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  if (record.employee.userId) {
    await createNotification({
      recipientId: record.employee.userId,
      type: "leave_cancelled",
      title: "Leave cancelled",
      message: "Your leave request was cancelled.",
      relatedModel: "Leave",
      relatedId: id,
    });
  }
  return updated;
}
