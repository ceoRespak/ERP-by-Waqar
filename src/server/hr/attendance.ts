import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import { calculateAttendanceStatus, getEffectiveShift, haversineMeters, startOfDay, timeOnDate } from "@/server/hr/helpers";
import { createNotification, notifyUsersByRole } from "@/server/hr/notifications";

// =====================================================================
// HR ATTENDANCE — faithful port of respakHRM attendanceController.js
// =====================================================================

export async function listAttendance(opts: { limit?: number; date?: string; month?: number; year?: number; projectId?: number; employeeId?: number; approvalStatus?: string } = {}) {
  return prisma.attendance.findMany({
    where: {
      ...(opts.date ? { date: new Date(opts.date) } : {}),
      ...(opts.month ? { month: opts.month } : {}),
      ...(opts.year ? { year: opts.year } : {}),
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
      ...(opts.approvalStatus ? { approvalStatus: opts.approvalStatus } : {}),
    },
    include: {
      employee: { select: { id: true, empCode: true, firstName: true, lastName: true, department: true } },
      project: { select: { id: true, name: true, code: true } },
      approvedByPM: { select: { id: true, name: true } },
      approvedByHR: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "desc" }, { employee: { firstName: "asc" } }],
    take: opts.limit ?? 500,
  });
}

export async function getAttendanceDetail(id: number) {
  return prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true, designation: true } },
      project: true,
      approvedByPM: { select: { id: true, name: true } },
      approvedByHR: { select: { id: true, name: true } },
    },
  });
}

type MarkAttendanceInput = {
  employeeId: number;
  projectId?: number | null;
  date: string;
  checkIn?: string | null; // "HH:MM"
  checkOut?: string | null;
  status?: string | null;
  notes?: string | null;
  method?: string | null;
  createdById?: number | null;
  isAdmin?: boolean;
};

/**
 * Mark (or update) attendance. Ported rules from respakHRM markAttendance:
 *  - no back-dating (date < today) unless admin
 *  - staff check-in cannot be back-dated >15min or future >5min (admins exempt)
 *  - status auto-computed from lateness unless explicitly provided
 *  - check-out updates the record and recomputes totalHours + status
 *  - notifies the project PM
 */
export async function markAttendance(data: MarkAttendanceInput) {
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId }, include: { currentProject: { include: { projectManager: { select: { userId: true } } } } } });
  if (!employee) throw new Error("Employee not found.");

  const projectId = data.projectId ?? employee.currentProjectId;
  const date = startOfDay(new Date(data.date));
  const today = startOfDay(new Date());
  const project = projectId
    ? await prisma.hrProject.findUnique({ where: { id: projectId }, include: { projectManager: { select: { userId: true } } } })
    : null;

  if (!data.isAdmin && date.getTime() < today.getTime()) throw new Error("Back-dated attendance is not allowed.");
  if (!project) throw new Error("Employee has no assigned project — cannot mark attendance.");

  const shift = getEffectiveShift(project, date);
  const checkIn = data.checkIn ? timeOnDate(date, data.checkIn) : null;
  const checkOut = data.checkOut ? timeOnDate(date, data.checkOut) : null;

  if (checkIn && !data.isAdmin) {
    const shiftStart = timeOnDate(date, shift.start);
    const backTime = Math.round((shiftStart.getTime() - checkIn.getTime()) / 60000) - 15; // grace 15 min
    const future = Math.round((checkIn.getTime() - Date.now()) / 60000);
    if (backTime > 0) throw new Error(`Check-in cannot be more than 15 minutes before shift start.`);
    if (future > 5) throw new Error("Check-in time is in the future.");
  }

  const totalHours = checkIn && checkOut ? Math.max(0, (checkOut.getTime() - checkIn.getTime()) / 3600000) : 0;
  const finalStatus = data.status && data.status !== "" ? data.status : checkIn ? calculateAttendanceStatus(checkIn, date, shift.start) : "PRESENT";

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const record = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date } },
    create: {
      employeeId: data.employeeId,
      projectId,
      date,
      checkIn,
      checkOut,
      checkInMethod: checkIn ? (data.method ?? "manual") : null,
      status: finalStatus,
      totalHours,
      month,
      year,
      notes: data.notes ?? null,
      createdById: data.createdById ?? null,
    },
    update: {
      projectId,
      checkIn: checkIn ?? undefined,
      checkOut: checkOut ?? undefined,
      checkInMethod: checkIn ? (data.method ?? "manual") : undefined,
      status: finalStatus,
      totalHours,
      notes: data.notes ?? undefined,
    },
  });

  // Notify the project PM (respakHRM attendance_marked)
  const pmUserId = project.projectManager?.userId;
  if (pmUserId && pmUserId !== data.createdById) {
    await createNotification({
      recipientId: pmUserId,
      senderId: data.createdById ?? null,
      type: "attendance_marked",
      title: "Attendance marked",
      message: `${employee.firstName} ${employee.lastName} — ${finalStatus.replace("_", " ")} on ${data.date}.`,
      relatedModel: "Attendance",
      relatedId: record.id,
    });
  }

  await auditLog({ userId: data.createdById, action: "CREATE", module: MODULES.HR, entity: "ATTENDANCE", entityId: record.id, details: { date: data.date, status: finalStatus } });
  return record;
}

/**
 * Self check-in (respakHRM self gates): registered device, GPS within radius,
 * not before shift start − 15min, face photo required for check-in.
 */
export async function markSelfAttendance(data: {
  userId: number;
  employeeId: number;
  projectId: number;
  lat?: number | null;
  lng?: number | null;
  deviceId?: string | null;
  facePhoto?: string | null;
  action: "check_in" | "check_out";
  method?: string | null;
}) {
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) throw new Error("Employee not found.");

  const project = await prisma.hrProject.findUnique({ where: { id: data.projectId } });
  if (!project) throw new Error("Project not found.");
  if (project.status !== "active" && project.status !== "planned") throw new Error("Project is not active for attendance.");

  const date = startOfDay(new Date());
  const shift = getEffectiveShift(project, date);

  // Gate 1: registered device (respakHRM markSelfAttendance)
  if (data.deviceId) {
    const device = await prisma.deviceRegistration.findFirst({
      where: { userId: data.userId, deviceId: data.deviceId, status: "approved" },
    });
    if (!device) throw new Error("This device is not registered and approved.");
  }

  // Gate 2: GPS within allowed radius
  if (data.lat != null && data.lng != null && project.locationLat != null && project.locationLng != null) {
    const dist = haversineMeters(data.lat, data.lng, project.locationLat.toNumber(), project.locationLng.toNumber());
    if (dist > project.allowedRadius) {
      throw new Error(`You are ${Math.round(dist)}m from the site (allowed ${project.allowedRadius}m).`);
    }
  } else if (data.lat == null || data.lng == null) {
    throw new Error("Location is required for self attendance.");
  }

  const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId: data.employeeId, date } } });

  if (data.action === "check_in") {
    // Gate 3: not before shift start - 15 min grace
    const earliest = timeOnDate(date, shift.start);
    earliest.setMinutes(earliest.getMinutes() - 15);
    if (Date.now() < earliest.getTime()) throw new Error(`Too early to check in (shift starts ${shift.start}).`);

    // Gate 4: face photo required
    if (!data.facePhoto) throw new Error("A face photo is required for check-in.");

    const status = calculateAttendanceStatus(new Date(), date, shift.start);
    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          checkInMethod: "gps",
          checkInLat: data.lat ?? null,
          checkInLng: data.lng ?? null,
          checkInPhoto: data.facePhoto,
          status,
        },
      });
    }
    return prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        projectId: data.projectId,
        date,
        checkIn: new Date(),
        checkInMethod: "gps",
        checkInLat: data.lat ?? null,
        checkInLng: data.lng ?? null,
        checkInPhoto: data.facePhoto,
        status,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        createdById: data.userId,
      },
    });
  }

  // Check-out: update the existing record + recompute status + totalHours
  if (!existing?.checkIn) throw new Error("No check-in found for today.");
  const checkOut = new Date();
  const totalHours = Math.max(0, (checkOut.getTime() - existing.checkIn.getTime()) / 3600000);
  return prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut,
      checkOutMethod: "gps",
      checkOutLat: data.lat ?? null,
      checkOutLng: data.lng ?? null,
      totalHours,
    },
  });
}

/** Verify a location against a project's allowed radius (JSON API for the self page). */
export async function verifyLocation(projectId: number, lat: number, lng: number) {
  const project = await prisma.hrProject.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found.");
  if (project.locationLat == null || project.locationLng == null) {
    return { valid: false, distance: null, allowedRadius: project.allowedRadius, projectLocation: null, reason: "Project has no GPS location set." };
  }
  const distance = haversineMeters(lat, lng, project.locationLat.toNumber(), project.locationLng.toNumber());
  return {
    valid: distance <= project.allowedRadius,
    distance: Math.round(distance),
    allowedRadius: project.allowedRadius,
    projectLocation: { lat: project.locationLat.toNumber(), lng: project.locationLng.toNumber() },
  };
}

export async function approveAttendanceByPM(id: number, userId: number) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new Error("Attendance record not found.");
  if (record.approvalStatus !== "pending") throw new Error("This record is already processed.");

  const updated = await prisma.attendance.update({
    where: { id },
    data: { approvalStatus: "approved_by_pm", approvedByPMId: userId, pmApprovalDate: new Date() },
  });
  await notifyUsersByRole(["HR_MANAGER", "ADMIN"], {
    type: "attendance_approved",
    title: "Attendance PM-approved",
    message: `Attendance for ${record.employeeId} was pre-approved by PM.`,
    relatedModel: "Attendance",
    relatedId: id,
  });
  return updated;
}

export async function approveAttendanceByHR(id: number, userId: number) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new Error("Attendance record not found.");
  if (record.approvalStatus !== "approved_by_pm") throw new Error("Attendance must be PM-approved first.");

  return prisma.attendance.update({
    where: { id },
    data: { approvalStatus: "approved_by_hr", approvedByHRId: userId, hrApprovalDate: new Date() },
  });
}

export async function rejectAttendance(id: number, userId: number, reason: string) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new Error("Attendance record not found.");
  return prisma.attendance.update({
    where: { id },
    data: { approvalStatus: "rejected", rejectionReason: reason },
  });
}

/** Monthly report — aggregate present/absent/late/half_day + totalHours per employee. */
export async function getMonthlyReport(month: number, year: number, opts: { projectId?: number; employeeId?: number } = {}) {
  const records = await prisma.attendance.findMany({
    where: { month, year, ...(opts.projectId ? { projectId: opts.projectId } : {}), ...(opts.employeeId ? { employeeId: opts.employeeId } : {}) },
    include: { employee: { include: { department: true } }, project: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });

  const byEmployee = new Map<number, { employee: (typeof records)[number]["employee"]; present: number; absent: number; late: number; halfDay: number; totalHours: number }>();
  for (const r of records) {
    const row = byEmployee.get(r.employeeId) ?? {
      employee: r.employee,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0,
    };
    if (r.status === "PRESENT") row.present++;
    else if (r.status === "ABSENT") row.absent++;
    else if (r.status === "LATE") row.late++;
    else if (r.status === "HALF_DAY") row.halfDay++;
    row.totalHours += r.totalHours.toNumber();
    byEmployee.set(r.employeeId, row);
  }
  const rows = Array.from(byEmployee.values()).map((r) => ({
    ...r,
    totalDays: r.present + r.absent + r.late + r.halfDay,
    presentPercent: r.present + r.absent + r.late + r.halfDay > 0 ? Math.round(((r.present + r.late) / (r.present + r.absent + r.late + r.halfDay)) * 100) : 0,
  }));

  return { month, year, rows, totalRecords: records.length };
}

// =====================================================================
// DAILY WAGES — faithful port of dailyWageController.js
// =====================================================================
export async function listDailyWages(opts: { month?: number; year?: number; projectId?: number; status?: string } = {}) {
  return prisma.dailyWage.findMany({
    where: {
      ...(opts.month ? { month: opts.month } : {}),
      ...(opts.year ? { year: opts.year } : {}),
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: { project: { select: { id: true, name: true, code: true } }, approvedBy: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
}

export async function listDailyWageWorkers(opts: { projectId?: number; isActive?: boolean } = {}) {
  return prisma.dailyWageWorker.findMany({
    where: { ...(opts.projectId ? { projectId: opts.projectId } : {}), ...(opts.isActive != null ? { isActive: opts.isActive } : {}) },
    include: { project: { select: { id: true, name: true, code: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createDailyWageWorker(data: { cnic: string; name: string; fatherName?: string | null; phone?: string | null; projectId: number; dailyWageAmount?: number }) {
  const cnic = data.cnic.replace(/\D/g, "");
  if (cnic.length !== 13) throw new Error("CNIC must be 13 digits.");
  return prisma.dailyWageWorker.create({
    data: { cnic, name: data.name, fatherName: data.fatherName ?? null, phone: data.phone ?? null, projectId: data.projectId, dailyWageAmount: data.dailyWageAmount ?? 0 },
  });
}

export async function updateDailyWageWorker(id: number, data: { name?: string; fatherName?: string | null; phone?: string | null; dailyWageAmount?: number; isActive?: boolean }) {
  return prisma.dailyWageWorker.update({
    where: { id },
    data: { name: data.name, fatherName: data.fatherName ?? null, phone: data.phone ?? null, dailyWageAmount: data.dailyWageAmount, isActive: data.isActive },
  });
}

export async function deleteDailyWageWorker(id: number) {
  await prisma.dailyWageWorker.delete({ where: { id } });
  return { ok: true };
}

/** Mark daily-wage attendance by CNIC (respakHRM markDailyWageAttendance). */
export async function markDailyWageAttendance(data: { cnic: string; projectId: number; date: string; checkIn?: string | null; checkOut?: string | null; amount?: number; markedById?: number | null }) {
  const cnic = data.cnic.replace(/\D/g, "");
  const date = startOfDay(new Date(data.date));
  const duplicate = await prisma.dailyWage.findUnique({ where: { cnic_date: { cnic, date } } });
  if (duplicate) throw new Error("Attendance already marked for this CNIC on this date.");

  const worker = await prisma.dailyWageWorker.findUnique({ where: { cnic } });
  const project = await prisma.hrProject.findUnique({ where: { id: data.projectId } });
  if (!project) throw new Error("Project not found.");

  const checkIn = data.checkIn ? timeOnDate(date, data.checkIn) : null;
  const checkOut = data.checkOut ? timeOnDate(date, data.checkOut) : null;
  const totalHours = checkIn && checkOut ? Math.max(0, (checkOut.getTime() - checkIn.getTime()) / 3600000) : 0;

  const record = await prisma.dailyWage.create({
    data: {
      cnic,
      name: worker?.name ?? data.cnic,
      fatherName: worker?.fatherName ?? null,
      phone: worker?.phone ?? null,
      projectId: data.projectId,
      date,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      dailyWageAmount: data.amount ?? worker?.dailyWageAmount ?? 0,
      totalHours,
      status: "present",
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    },
  });

  // If CNIC belongs to a registered daily-wage employee, also write a regular Attendance
  const employee = await prisma.employee.findFirst({ where: { cnic, employeeType: "daily_wages" } });
  if (employee && employee.currentProjectId) {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date } },
      create: {
        employeeId: employee.id,
        projectId: data.projectId,
        date,
        checkIn,
        checkOut,
        checkInMethod: "cnic",
        status: "PRESENT",
        isDailyWage: true,
        cnicNumber: cnic,
        dailyWageAmount: record.dailyWageAmount,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      },
      update: { checkIn: checkIn ?? undefined, checkOut: checkOut ?? undefined, isDailyWage: true, cnicNumber: cnic },
    });
  }

  await auditLog({ userId: data.markedById, action: "CREATE", module: MODULES.HR, entity: "DAILY_WAGE", entityId: record.id, details: { cnic, date: data.date } });
  return record;
}

export async function approveDailyWage(id: number, userId: number) {
  return prisma.dailyWage.update({ where: { id }, data: { approvalStatus: "approved", approvedById: userId } });
}

export async function dailyWageMonthlyReport(month: number, year: number, opts: { projectId?: number } = {}) {
  const records = await prisma.dailyWage.findMany({
    where: { month, year, ...(opts.projectId ? { projectId: opts.projectId } : {}) },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });
  const byWorker = new Map<string, { cnic: string; name: string; totalDays: number; totalWages: number }>();
  for (const r of records) {
    const row = byWorker.get(r.cnic) ?? { cnic: r.cnic, name: r.name, totalDays: 0, totalWages: 0 };
    row.totalDays += 1;
    row.totalWages += r.dailyWageAmount.toNumber();
    byWorker.set(r.cnic, row);
  }
  const workers = Array.from(byWorker.values());
  return { month, year, workers, totalWages: workers.reduce((s, w) => s + w.totalWages, 0) };
}
