import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";

// =====================================================================
// PROJECT PROGRESS
// Activity WBS tree -> ActivityProgress (planned vs actual per day) ->
// ProjectProgress (S-curve points) + LaborLog + EquipmentUsageLog
// =====================================================================

export async function listActivities(projectId: number) {
  return prisma.activity.findMany({
    where: { projectId },
    include: {
      progress: { orderBy: { reportDate: "desc" }, take: 1 },
      _count: { select: { children: true } },
    },
    orderBy: { wbsCode: "asc" },
  });
}

export async function createActivity(data: {
  projectId: number;
  parentId?: number | null;
  wbsCode: string;
  name: string;
  unit?: string | null;
  totalQty?: number;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}) {
  const record = await prisma.activity.create({
    data: {
      projectId: data.projectId,
      parentId: data.parentId ?? null,
      wbsCode: data.wbsCode,
      name: data.name,
      unit: data.unit ?? "EA",
      totalQty: data.totalQty ?? 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status ?? "PLANNED",
    },
  });
  await auditLog({
    action: "CREATE",
    module: MODULES.PROGRESS,
    entity: "ACTIVITY",
    entityId: record.id,
    details: { wbsCode: record.wbsCode, name: record.name },
  });
  return record;
}

// ---------------------------------------------------------------------
// Daily progress recording + S-curve recomputation
// ---------------------------------------------------------------------
export async function recordActivityProgress(data: {
  activityId: number;
  reportDate: string;
  plannedQty: number;
  actualQty: number;
  notes?: string | null;
}) {
  const activity = await prisma.activity.findUnique({
    where: { id: data.activityId },
    include: { project: { select: { id: true } } },
  });
  if (!activity) throw new Error("Activity not found.");

  const date = new Date(data.reportDate);
  const totalQty = activity.totalQty.toNumber();
  const percent = totalQty > 0 ? (data.actualQty / totalQty) * 100 : 0;

  const record = await prisma.activityProgress.upsert({
    where: { activityId_reportDate: { activityId: activity.id, reportDate: date } },
    create: {
      activityId: activity.id,
      reportDate: date,
      plannedQty: data.plannedQty,
      actualQty: data.actualQty,
      percent,
      notes: data.notes,
    },
    update: {
      plannedQty: data.plannedQty,
      actualQty: data.actualQty,
      percent,
      notes: data.notes,
    },
  });

  await recomputeProjectProgress(activity.project.id, date);
  return record;
}

/** Aggregate all activities' progress into a cumulative ProjectProgress (S-curve) point. */
export async function recomputeProjectProgress(projectId: number, date: Date) {
  // Cumulative: sum every daily record up to (and including) the given date,
  // so the S-curve is monotonic — each point = progress achieved as of that date.
  const [progressRows, activities] = await Promise.all([
    prisma.activityProgress.findMany({
      where: { activity: { projectId }, reportDate: { lte: date } },
    }),
    prisma.activity.findMany({ where: { projectId } }),
  ]);

  const totalQty = activities.reduce((s, a) => s + a.totalQty.toNumber(), 0);
  const plannedQty = progressRows.reduce((s, p) => s + p.plannedQty.toNumber(), 0);
  const actualQty = progressRows.reduce((s, p) => s + p.actualQty.toNumber(), 0);
  const plannedPercent = totalQty > 0 ? (plannedQty / totalQty) * 100 : 0;
  const actualPercent = totalQty > 0 ? (actualQty / totalQty) * 100 : 0;

  return prisma.projectProgress.upsert({
    where: { projectId_reportDate: { projectId, reportDate: date } },
    create: { projectId, reportDate: date, plannedPercent, actualPercent },
    update: { plannedPercent, actualPercent },
  });
}

/** Ordered S-curve data points for a project. */
export async function listProjectProgress(projectId: number) {
  return prisma.projectProgress.findMany({
    where: { projectId },
    orderBy: { reportDate: "asc" },
  });
}

// ---------------------------------------------------------------------
// Labor deployment
// ---------------------------------------------------------------------
export async function listLaborLogs(projectId: number) {
  return prisma.laborLog.findMany({
    where: { projectId },
    include: { activity: { select: { id: true, wbsCode: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createLaborLog(data: {
  projectId: number;
  activityId?: number | null;
  date?: string;
  laborType?: string | null;
  count: number;
  notes?: string | null;
}) {
  return prisma.laborLog.create({
    data: {
      projectId: data.projectId,
      activityId: data.activityId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      laborType: data.laborType ?? "LABOUR",
      count: data.count,
      notes: data.notes,
    },
  });
}

// ---------------------------------------------------------------------
// Site equipment
// ---------------------------------------------------------------------
export async function listEquipments(projectId: number) {
  return prisma.equipment.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
}

export async function createEquipment(data: {
  projectId: number;
  code: string;
  name: string;
  type?: string | null;
  capacity?: string | null;
  status?: string;
}) {
  return prisma.equipment.create({
    data: {
      projectId: data.projectId,
      code: data.code,
      name: data.name,
      type: data.type ?? null,
      capacity: data.capacity ?? null,
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function listEquipmentUsage(projectId: number) {
  return prisma.equipmentUsageLog.findMany({
    where: { projectId },
    include: { equipment: { select: { id: true, code: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createEquipmentUsage(data: {
  equipmentId: number;
  projectId: number;
  date?: string;
  hours: number;
  operatorEmployeeId?: number | null;
  notes?: string | null;
}) {
  return prisma.equipmentUsageLog.create({
    data: {
      equipmentId: data.equipmentId,
      projectId: data.projectId,
      date: data.date ? new Date(data.date) : new Date(),
      hours: data.hours,
      operatorEmployeeId: data.operatorEmployeeId ?? null,
      notes: data.notes,
    },
  });
}
