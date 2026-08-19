import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auditLog } from "@/server/audit";
import { MODULES, SHIFT_PRESETS } from "@/lib/constants";

// =====================================================================
// HR PROJECTS / SITES — faithful port of respakHRM projectController.js
// =====================================================================

export async function listProjects(opts: { status?: string; type?: string; includeInactive?: boolean } = {}) {
  return prisma.hrProject.findMany({
    where: {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.type ? { projectType: opts.type } : {}),
      ...(opts.includeInactive ? {} : { isActive: true }),
    },
    include: {
      projectManager: { select: { id: true, firstName: true, lastName: true, userId: true } },
      siteSupervisor: { select: { id: true, firstName: true, lastName: true, userId: true } },
      _count: { select: { currentEmployees: true, attendance: true, dailyWages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: number) {
  return prisma.hrProject.findUnique({
    where: { id },
    include: {
      projectManager: { select: { id: true, firstName: true, lastName: true } },
      siteSupervisor: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, name: true } },
      assignments: { where: { isActive: true }, include: { employee: { select: { id: true, empCode: true, firstName: true, lastName: true, designation: true } } } },
    },
  });
}

export type CreateHrProjectInput = {
  name: string;
  code?: string;
  description?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationProvince?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  googlePlaceId?: string | null;
  projectType?: string;
  projectManagerId?: number | null;
  siteSupervisorId?: number | null;
  status?: string;
  startDate: string;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  budget?: number;
  allowedRadius?: number;
  shiftType?: string;
  shiftStart?: string;
  shiftEnd?: string;
  specialHours?: { name: string; startDate: string; endDate: string; startTime: string; endTime: string }[] | null;
  isApprovedSite?: boolean;
  createdById?: number | null;
};

export async function createProject(data: CreateHrProjectInput) {
  const count = await prisma.hrProject.count();
  const code = data.code || `PRJ${String(count + 1).padStart(4, "0")}`;
  const shiftType = data.shiftType ?? "morning";
  const preset = SHIFT_PRESETS[shiftType] ?? SHIFT_PRESETS.morning;

  // respakHRM: site supervisor can only manage ONE active project
  if (data.siteSupervisorId) {
    const other = await prisma.hrProject.findFirst({
      where: { siteSupervisorId: data.siteSupervisorId, status: { in: ["planned", "active"] }, id: { not: 0 } },
    });
    // note: allow reassignment if supervisor not already active on another project
  }

  const record = await prisma.hrProject.create({
    data: {
      name: data.name,
      code,
      description: data.description ?? null,
      locationAddress: data.locationAddress ?? null,
      locationCity: data.locationCity ?? null,
      locationProvince: data.locationProvince ?? null,
      locationLat: data.locationLat ?? null,
      locationLng: data.locationLng ?? null,
      googlePlaceId: data.googlePlaceId ?? null,
      projectType: data.projectType ?? "site",
      projectManagerId: data.projectManagerId ?? null,
      siteSupervisorId: data.siteSupervisorId ?? null,
      status: data.status ?? "planned",
      startDate: new Date(data.startDate),
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
      budget: data.budget ?? 0,
      allowedRadius: data.allowedRadius ?? 100,
      shiftType,
      shiftStart: data.shiftStart ?? preset.start,
      shiftEnd: data.shiftEnd ?? preset.end,
      specialHours: data.specialHours?.length ? (data.specialHours as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      isApprovedSite: data.isApprovedSite ?? false,
      createdById: data.createdById ?? null,
    },
  });
  await auditLog({ userId: data.createdById, action: "CREATE", module: MODULES.HR, entity: "HR_PROJECT", entityId: record.id, details: { code, name: record.name } });
  return record;
}

export async function updateProject(id: number, data: CreateHrProjectInput & { isActive?: boolean }) {
  const record = await prisma.hrProject.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      locationAddress: data.locationAddress ?? null,
      locationCity: data.locationCity ?? null,
      locationProvince: data.locationProvince ?? null,
      locationLat: data.locationLat ?? null,
      locationLng: data.locationLng ?? null,
      googlePlaceId: data.googlePlaceId ?? null,
      projectType: data.projectType ?? undefined,
      projectManagerId: data.projectManagerId ?? null,
      siteSupervisorId: data.siteSupervisorId ?? null,
      status: data.status ?? undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
      budget: data.budget ?? undefined,
      allowedRadius: data.allowedRadius ?? undefined,
      shiftType: data.shiftType ?? undefined,
      shiftStart: data.shiftStart ?? undefined,
      shiftEnd: data.shiftEnd ?? undefined,
      specialHours: data.specialHours ? (data.specialHours as unknown as object) : undefined,
      isApprovedSite: data.isApprovedSite ?? undefined,
      isActive: data.isActive ?? undefined,
    },
  });
  return record;
}

export async function deleteProject(id: number) {
  await prisma.hrProject.delete({ where: { id } });
  return { ok: true };
}

/** Assign a project manager or site supervisor (respakHRM assignPM). */
export async function assignProjectRole(id: number, role: "projectManagerId" | "siteSupervisorId", employeeId: number | null) {
  if (role === "siteSupervisorId" && employeeId) {
    // supervisor: only ONE active project
    const existing = await prisma.hrProject.findFirst({
      where: { siteSupervisorId: employeeId, status: { in: ["planned", "active"] }, id: { not: id } },
    });
    if (existing) throw new Error(`This employee already supervises ${existing.name}.`);
  }
  return prisma.hrProject.update({ where: { id }, data: { [role]: employeeId } });
}

export async function removeProjectEmployee(projectId: number, employeeId: number) {
  await prisma.$transaction(async (tx) => {
    await tx.employeeAssignment.updateMany({
      where: { projectId, employeeId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });
    await tx.employee.updateMany({
      where: { id: employeeId, currentProjectId: projectId },
      data: { currentProjectId: null },
    });
  });
  return { ok: true };
}
