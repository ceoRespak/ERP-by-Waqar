import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auditLog } from "@/server/audit";
import { MODULES, APPROVAL_ENTITY_TYPES } from "@/lib/constants";
import { submitForApproval } from "@/server/approval/service";
import { generateEmployeeCode, generatePassword } from "@/server/hr/helpers";
import { notifyUsersByRole } from "@/server/hr/notifications";
import bcrypt from "bcryptjs";

// =====================================================================
// HR EMPLOYEES — advanced port of respakHRM employeeController.js
// =====================================================================

/** Map HR system roles onto ERP role names. */
export const HR_SYSTEM_ROLE_MAP: Record<string, string> = {
  admin: "ADMIN",
  hr_manager: "HR_MANAGER",
  project_manager: "PROJECT_MANAGER",
  employee: "EMPLOYEE",
};

export async function listEmployees(opts: { limit?: number; status?: string; departmentId?: number } = {}) {
  return prisma.employee.findMany({
    where: {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.departmentId ? { departmentId: opts.departmentId } : {}),
    },
    include: {
      department: true,
      designation: true,
      currentProject: { select: { id: true, name: true, code: true } },
      _count: { select: { attendance: true, leaveRequests: true } },
    },
    orderBy: [{ firstName: "asc" }],
    take: opts.limit ?? 500,
  });
}

export async function getEmployeeDetail(id: number) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      designation: true,
      user: { select: { id: true, email: true, name: true, status: true } },
      currentProject: true,
      assignments: { include: { project: true }, orderBy: { startDate: "desc" } },
      leaveBalances: { include: { leaveType: true } },
      faceEnrollments: { orderBy: { requestedAt: "desc" }, take: 5 },
    },
  });
}

function sanitizeDigits(v?: string | null): string | null {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  return d || null;
}

function computeTotalAllowance(basicSalary: number, breakdown?: { name: string; type: string; amount: number; isActive?: boolean }[] | null): number {
  if (!breakdown || breakdown.length === 0) return 0;
  return breakdown
    .filter((a) => a.isActive !== false)
    .reduce((sum, a) => sum + (a.type === "percentage" ? (a.amount / 100) * basicSalary : a.amount), 0);
}

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  fatherName?: string | null;
  cnic?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  emergencyPhone?: string | null;
  email?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  employeeType?: string;
  departmentId?: number | null;
  designationId?: number | null;
  joiningDate?: string | null;
  contractEndDate?: string | null;
  basicSalary?: number;
  hourlyRate?: number;
  dailyWage?: number;
  rank?: string | null;
  wht?: number;
  advances?: number;
  bankName?: string | null;
  bankAccount?: string | null;
  biometricId?: string | null;
  currentProjectId?: number | null;
  allowances?: { name: string; type: string; amount: number; isActive?: boolean }[] | null;
  systemRole?: string | null;
  createUser?: boolean;
  password?: string | null;
  createdById?: number | null;
};

export async function createEmployee(data: CreateEmployeeInput) {
  const dept = data.departmentId ? await prisma.department.findUnique({ where: { id: data.departmentId } }) : null;
  const desig = data.designationId ? await prisma.designation.findUnique({ where: { id: data.designationId } }) : null;

  // Employee code: DEPT2 + DESIG2 + 4-digit count (respakHRM generateEmployeeCode)
  const prefixBase = `${(dept?.name ?? "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "XX"}${(desig?.name ?? "XX")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "XX"}`;
  const existingCount = await prisma.employee.count({ where: { empCode: { startsWith: prefixBase } } });
  const empCode = generateEmployeeCode(dept?.name ?? "", desig?.name ?? "", existingCount);

  const cnic = sanitizeDigits(data.cnic);
  const phone = sanitizeDigits(data.phone) ?? null;
  const basicSalary = data.basicSalary ?? 0;
  const breakdown = data.allowances?.length ? data.allowances : null;
  const totalAllowances = breakdown ? computeTotalAllowance(basicSalary, breakdown) : 0;

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        empCode,
        firstName: data.firstName,
        lastName: data.lastName,
        fatherName: data.fatherName ?? null,
        cnic,
        gender: data.gender ?? null,
        maritalStatus: data.maritalStatus ?? null,
        bloodGroup: data.bloodGroup ?? null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        phone,
        emergencyPhone: sanitizeDigits(data.emergencyPhone) ?? null,
        email: data.email?.toLowerCase() ?? null,
        presentAddress: data.presentAddress ?? null,
        permanentAddress: data.permanentAddress ?? null,
        employeeType: data.employeeType ?? "permanent",
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        status: "ACTIVE",
        basicSalary,
        hourlyRate: data.hourlyRate ?? 0,
        dailyWage: data.dailyWage ?? 0,
        rank: data.rank ?? null,
        wht: data.wht ?? 0,
        advances: data.advances ?? 0,
        allowances: totalAllowances,
        allowanceBreakdown: breakdown ? (breakdown as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        bankName: data.bankName ?? null,
        bankAccount: data.bankAccount ?? null,
        biometricId: data.biometricId ?? null,
        currentProjectId: data.currentProjectId ?? null,
        createdById: data.createdById ?? null,
      },
    });

    // Seed leave balances from all active leave types (respakHRM behaviour)
    const leaveTypes = await tx.leaveTypeConfig.findMany({ where: { isActive: true } });
    if (leaveTypes.length) {
      await tx.leaveBalance.createMany({
        data: leaveTypes.map((lt) => ({
          employeeId: employee.id,
          leaveTypeConfigId: lt.id,
          total: lt.defaultTotal,
          used: 0,
        })),
      });
    }

    // Create linked login user when requested
    let userId: number | null = null;
    if (data.createUser && data.email) {
      const roleName = data.systemRole ? HR_SYSTEM_ROLE_MAP[data.systemRole] ?? "EMPLOYEE" : "EMPLOYEE";
      const role = await tx.role.findUnique({ where: { name: roleName } });
      const password = data.password || generatePassword();
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: await bcrypt.hash(password, 10),
          name: `${data.firstName} ${data.lastName}`,
          phone,
          status: "ACTIVE",
          roles: role ? { create: { roleId: role.id } } : undefined,
          employee: { connect: { id: employee.id } },
        },
      });
      userId = user.id;
      await tx.employee.update({ where: { id: employee.id }, data: { userId } });
    }

    await auditLog({
      userId: data.createdById,
      action: "CREATE",
      module: MODULES.HR,
      entity: "EMPLOYEE",
      entityId: employee.id,
      details: { empCode, name: `${data.firstName} ${data.lastName}` },
    });

    await notifyUsersByRole(["HR_MANAGER", "ADMIN"], {
      type: "new_employee",
      title: "New employee added",
      message: `${data.firstName} ${data.lastName} (${empCode}) was added to the system.`,
      relatedModel: "Employee",
      relatedId: employee.id,
      priority: "normal",
    });

    return { ...employee, userId, tempPassword: data.createUser ? (data.password ?? undefined) : undefined };
  });
}

export async function updateEmployee(id: number, data: CreateEmployeeInput & { employmentStatus?: string; resignationDate?: string | null }) {
  const existing = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!existing) throw new Error("Employee not found.");

  const cnic = sanitizeDigits(data.cnic);
  const phone = sanitizeDigits(data.phone) ?? null;
  const basicSalary = data.basicSalary ?? existing.basicSalary.toNumber();
  const breakdown = data.allowances?.length ? data.allowances : (existing.allowanceBreakdown as { name: string; type: string; amount: number; isActive?: boolean }[] | null);
  const totalAllowances = breakdown ? computeTotalAllowance(basicSalary, breakdown) : existing.allowances.toNumber();

  // respakHRM one-active-project rule: changing currentProject deactivates other active assignments
  if (data.currentProjectId && data.currentProjectId !== existing.currentProjectId) {
    await prisma.employeeAssignment.updateMany({
      where: { employeeId: id, isActive: true, projectId: { not: data.currentProjectId } },
      data: { isActive: false, endDate: new Date() },
    });
    const already = await prisma.employeeAssignment.findUnique({
      where: { employeeId_projectId: { employeeId: id, projectId: data.currentProjectId } },
    });
    if (!already) {
      await prisma.employeeAssignment.create({
        data: { employeeId: id, projectId: data.currentProjectId, isActive: true },
      });
    } else {
      await prisma.employeeAssignment.update({
        where: { id: already.id },
        data: { isActive: true, endDate: null },
      });
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName ?? null,
      cnic,
      gender: data.gender ?? null,
      maritalStatus: data.maritalStatus ?? null,
      bloodGroup: data.bloodGroup ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : existing.dateOfBirth,
      phone,
      emergencyPhone: sanitizeDigits(data.emergencyPhone) ?? null,
      email: data.email?.toLowerCase() ?? null,
      presentAddress: data.presentAddress ?? null,
      permanentAddress: data.permanentAddress ?? null,
      employeeType: data.employeeType ?? existing.employeeType,
      departmentId: data.departmentId ?? existing.departmentId,
      designationId: data.designationId ?? existing.designationId,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : existing.joiningDate,
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : existing.contractEndDate,
      status: data.employmentStatus ?? existing.status,
      resignationDate: data.resignationDate ? new Date(data.resignationDate) : existing.resignationDate,
      basicSalary,
      hourlyRate: data.hourlyRate ?? existing.hourlyRate.toNumber(),
      dailyWage: data.dailyWage ?? existing.dailyWage.toNumber(),
      rank: data.rank ?? null,
      wht: data.wht ?? existing.wht.toNumber(),
      advances: data.advances ?? existing.advances.toNumber(),
      allowances: totalAllowances,
      allowanceBreakdown: breakdown ? (breakdown as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      biometricId: data.biometricId ?? null,
      currentProjectId: data.currentProjectId ?? existing.currentProjectId,
    },
  });

  // Keep linked user in sync
  if (existing.user) {
    await prisma.user.update({
      where: { id: existing.user.id },
      data: {
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email ?? existing.user.email,
        phone,
        status: employee.status === "ACTIVE" ? "ACTIVE" : employee.status === "TERMINATED" || employee.status === "RESIGNED" ? "INACTIVE" : existing.user.status,
      },
    });
  }

  await auditLog({ action: "UPDATE", module: MODULES.HR, entity: "EMPLOYEE", entityId: id, details: { empCode: employee.empCode } });
  return employee;
}

/** Soft-delete: mark terminated + deactivate the linked user (respakHRM deleteEmployee). */
export async function deleteEmployee(id: number, actedById?: number | null) {
  const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!employee) throw new Error("Employee not found.");
  await prisma.employee.update({ where: { id }, data: { status: "TERMINATED", resignationDate: new Date() } });
  if (employee.user) await prisma.user.update({ where: { id: employee.user.id }, data: { status: "INACTIVE" } });
  await auditLog({ userId: actedById, action: "DELETE", module: MODULES.HR, entity: "EMPLOYEE", entityId: id, details: { empCode: employee.empCode } });
  return { ok: true };
}

/** Assign employee to a project — one active project per employee (respakHRM rule). */
export async function assignProject(employeeId: number, projectId: number, role?: string | null, actedById?: number | null) {
  const project = await prisma.hrProject.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found.");

  await prisma.$transaction(async (tx) => {
    await tx.employeeAssignment.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });
    const existing = await tx.employeeAssignment.findUnique({
      where: { employeeId_projectId: { employeeId, projectId } },
    });
    if (existing) {
      await tx.employeeAssignment.update({ where: { id: existing.id }, data: { isActive: true, endDate: null, role: role ?? null } });
    } else {
      await tx.employeeAssignment.create({ data: { employeeId, projectId, role: role ?? null, isActive: true } });
    }
    await tx.employee.update({ where: { id: employeeId }, data: { currentProjectId: projectId } });
  });

  await notifyUsersByRole(["ADMIN", "HR_MANAGER"], {
    type: "project_assigned",
    title: "Project assignment",
    message: `An employee was assigned to ${project.name}.`,
    relatedModel: "Project",
    relatedId: projectId,
  });
  await auditLog({ userId: actedById, action: "UPDATE", module: MODULES.HR, entity: "EMPLOYEE_ASSIGNMENT", entityId: employeeId, details: { projectId } });
  return project;
}

export async function deactivateAssignment(employeeId: number, assignmentId: number) {
  await prisma.employeeAssignment.updateMany({
    where: { id: assignmentId, employeeId },
    data: { isActive: false, endDate: new Date() },
  });
  const stillActive = await prisma.employeeAssignment.findFirst({ where: { employeeId, isActive: true } });
  await prisma.employee.update({
    where: { id: employeeId },
    data: { currentProjectId: stillActive?.projectId ?? null },
  });
  return { ok: true };
}

export async function addAllowance(employeeId: number, data: { name: string; type: string; amount: number }) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found.");
  const breakdown = (employee.allowanceBreakdown as { name: string; type: string; amount: number; isActive?: boolean }[] | null) ?? [];
  const next = [...breakdown, { name: data.name, type: data.type, amount: data.amount, isActive: true }];
  const basic = employee.basicSalary.toNumber();
  await prisma.employee.update({
    where: { id: employeeId },
    data: { allowanceBreakdown: next as unknown as object, allowances: computeTotalAllowance(basic, next) },
  });
  return { ok: true };
}

export async function toggleAllowance(employeeId: number, index: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found.");
  const breakdown = [...((employee.allowanceBreakdown as { name: string; type: string; amount: number; isActive?: boolean }[] | null) ?? [])];
  if (!breakdown[index]) throw new Error("Allowance not found.");
  breakdown[index] = { ...breakdown[index], isActive: !breakdown[index].isActive };
  const basic = employee.basicSalary.toNumber();
  await prisma.employee.update({
    where: { id: employeeId },
    data: { allowanceBreakdown: breakdown as unknown as object, allowances: computeTotalAllowance(basic, breakdown) },
  });
  return { ok: true };
}

export async function updateLeaveSettings(employeeId: number, balances: { leaveTypeConfigId: number; total: number }[]) {
  for (const b of balances) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeConfigId: { employeeId, leaveTypeConfigId: b.leaveTypeConfigId } },
      update: { total: b.total },
      create: { employeeId, leaveTypeConfigId: b.leaveTypeConfigId, total: b.total, used: 0 },
    });
  }
  return { ok: true };
}

export async function addAttachment(employeeId: number, data: { name: string; file: string }) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found.");
  const attachments = (employee.attachments as { name: string; file: string; addedAt?: string }[] | null) ?? [];
  await prisma.employee.update({
    where: { id: employeeId },
    data: { attachments: [...attachments, { name: data.name, file: data.file, addedAt: new Date().toISOString() }] as unknown as object },
  });
  return { ok: true };
}

export async function removeAttachment(employeeId: number, index: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found.");
  const attachments = [...((employee.attachments as unknown[] | null) ?? [])];
  attachments.splice(index, 1);
  await prisma.employee.update({ where: { id: employeeId }, data: { attachments: attachments as unknown as object } });
  return { ok: true };
}

export async function resetEmployeePassword(employeeId: number, newPassword?: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { user: true } });
  if (!employee?.user) throw new Error("No linked user for this employee.");
  const password = newPassword || generatePassword();
  await prisma.user.update({ where: { id: employee.user.id }, data: { password: await bcrypt.hash(password, 10) } });
  return { password };
}

export async function updateEmployeeRole(employeeId: number, roleName: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { user: { include: { roles: true } } } });
  if (!employee?.user) throw new Error("No linked user for this employee.");
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role ${roleName} not found.`);
  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: employee.user!.id } });
    await tx.userRole.create({ data: { userId: employee.user!.id, roleId: role.id } });
  });
  return { ok: true };
}

// ---------------------------------------------------------------------
// Departments & Designations (kept)
// ---------------------------------------------------------------------
export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
}
export async function createDepartment(data: { name: string; code?: string | null }) {
  return prisma.department.create({ data: { name: data.name, code: data.code } });
}
export async function listDesignations() {
  return prisma.designation.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
}
export async function createDesignation(data: { name: string }) {
  return prisma.designation.create({ data: { name: data.name } });
}

// ---------------------------------------------------------------------
// Payroll (kept from original ERP HR module)
// ---------------------------------------------------------------------
export async function listPayrollRuns(opts: { limit?: number } = {}) {
  return prisma.payrollRun.findMany({
    include: {
      items: { include: { employee: { select: { id: true, empCode: true, firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
  });
}

export async function createPayrollRun(data: {
  period: string;
  startDate: string;
  endDate: string;
  processedById?: number | null;
  activeOnly?: boolean;
}) {
  const existing = await prisma.payrollRun.findUnique({ where: { period: data.period } });
  if (existing) throw new Error(`Payroll for period ${data.period} already exists.`);

  const employees = await prisma.employee.findMany({
    where: data.activeOnly === false ? {} : { status: "ACTIVE" },
    orderBy: { firstName: "asc" },
  });

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.payrollRun.create({
      data: {
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        processedById: data.processedById ?? null,
        status: "DRAFT",
        items: {
          create: employees.map((e) => ({
            employeeId: e.id,
            basicSalary: e.basicSalary,
            allowances: e.allowances,
            deductions: 0,
            netSalary: e.basicSalary.toNumber() + e.allowances.toNumber(),
          })),
        },
      },
    });
    return created;
  });

  await auditLog({
    userId: data.processedById,
    action: "CREATE",
    module: MODULES.HR,
    entity: "PAYROLL_RUN",
    entityId: run.id,
    details: { period: data.period, employees: employees.length },
  });
  return run;
}

export async function submitPayrollRun(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.payrollRun.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Payroll run not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.PAYROLL_RUN,
    entityId: record.id,
    module: MODULES.HR,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

