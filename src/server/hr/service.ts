import { prisma } from "@/lib/db";
import { nextDocNo } from "@/server/docno";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";
import type { LeaveType } from "@prisma/client";

// =====================================================================
// HR & PAYROLL
// =====================================================================

export async function listEmployees(opts: { limit?: number; status?: string } = {}) {
  return prisma.employee.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: { department: true, designation: true },
    orderBy: [{ firstName: "asc" }],
    take: opts.limit ?? 500,
  });
}

export async function createEmployee(data: {
  empCode: string;
  firstName: string;
  lastName: string;
  cnic?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  departmentId?: number | null;
  designationId?: number | null;
  joiningDate?: string | null;
  basicSalary?: number;
  allowances?: number;
  bankName?: string | null;
  bankAccount?: string | null;
}) {
  const record = await prisma.employee.create({
    data: {
      empCode: data.empCode,
      firstName: data.firstName,
      lastName: data.lastName,
      cnic: data.cnic ?? null,
      gender: data.gender ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      departmentId: data.departmentId ?? null,
      designationId: data.designationId ?? null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
      basicSalary: data.basicSalary ?? 0,
      allowances: data.allowances ?? 0,
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      status: "ACTIVE",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.HR, entity: "EMPLOYEE", entityId: record.id, details: { empCode: record.empCode } });
  return record;
}

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
// Attendance
// ---------------------------------------------------------------------
export async function listAttendance(opts: { limit?: number; date?: string } = {}) {
  return prisma.attendance.findMany({
    where: opts.date ? { date: new Date(opts.date) } : undefined,
    include: { employee: { select: { id: true, empCode: true, firstName: true, lastName: true } } },
    orderBy: [{ date: "desc" }],
    take: opts.limit ?? 500,
  });
}

export async function markAttendance(data: {
  employeeId: number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  notes?: string | null;
}) {
  const date = new Date(data.date);
  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date } },
    create: {
      employeeId: data.employeeId,
      date,
      checkIn: data.checkIn ? new Date(`${data.date}T${data.checkIn}`) : null,
      checkOut: data.checkOut ? new Date(`${data.date}T${data.checkOut}`) : null,
      status: data.status,
      notes: data.notes,
    },
    update: {
      checkIn: data.checkIn ? new Date(`${data.date}T${data.checkIn}`) : undefined,
      checkOut: data.checkOut ? new Date(`${data.date}T${data.checkOut}`) : undefined,
      status: data.status,
      notes: data.notes,
    },
  });
}

// ---------------------------------------------------------------------
// Leave Requests (with approval)
// ---------------------------------------------------------------------
export async function listLeaveRequests(opts: { limit?: number } = {}) {
  return prisma.leaveRequest.findMany({
    include: {
      employee: { select: { id: true, empCode: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createLeaveRequest(data: {
  employeeId: number;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
}) {
  const record = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      days: data.days,
      reason: data.reason,
      status: "DRAFT",
    },
  });
  return record;
}

export async function submitLeaveRequest(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Leave request not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.LEAVE_REQUEST,
    entityId: record.id,
    module: MODULES.HR,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Payroll
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
