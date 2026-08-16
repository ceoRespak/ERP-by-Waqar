import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { VehicleType, FuelType } from "@prisma/client";

// =====================================================================
// VEHICLE TRACKING
// =====================================================================

export async function listVehicles(opts: { limit?: number; status?: string } = {}) {
  return prisma.vehicle.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      driver: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { trips: true, fuelLogs: true, maintenances: true } },
    },
    orderBy: { regNo: "asc" },
    take: opts.limit ?? 200,
  });
}

export async function createVehicle(data: {
  regNo: string;
  type: VehicleType;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: string | null;
  fuelType?: FuelType;
  purchaseDate?: string | null;
  cost?: number | null;
  currentKm?: number | null;
  driverEmployeeId?: number | null;
  notes?: string | null;
}) {
  const record = await prisma.vehicle.create({
    data: {
      regNo: data.regNo,
      type: data.type,
      brand: data.brand ?? null,
      model: data.model ?? null,
      year: data.year ?? null,
      capacity: data.capacity ?? null,
      fuelType: data.fuelType ?? "DIESEL",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      cost: data.cost ?? null,
      currentKm: data.currentKm ?? null,
      driverEmployeeId: data.driverEmployeeId ?? null,
      notes: data.notes,
      status: "ACTIVE",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.VEHICLES, entity: "VEHICLE", entityId: record.id, details: { regNo: record.regNo } });
  return record;
}

export async function listTrips(opts: { limit?: number } = {}) {
  return prisma.vehicleTrip.findMany({
    include: {
      vehicle: { select: { id: true, regNo: true, brand: true, model: true } },
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createTrip(data: {
  vehicleId: number;
  driverEmployeeId?: number | null;
  date?: string;
  startKm?: number | null;
  endKm?: number | null;
  purpose: string;
  projectId?: number | null;
  notes?: string | null;
}) {
  const record = await prisma.vehicleTrip.create({
    data: {
      vehicleId: data.vehicleId,
      driverEmployeeId: data.driverEmployeeId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      startKm: data.startKm ?? null,
      endKm: data.endKm ?? null,
      purpose: data.purpose,
      projectId: data.projectId ?? null,
      notes: data.notes,
    },
  });

  if (data.endKm) {
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { currentKm: data.endKm },
    });
  }
  return record;
}

export async function listFuelLogs(opts: { limit?: number } = {}) {
  return prisma.fuelLog.findMany({
    include: {
      vehicle: { select: { id: true, regNo: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createFuelLog(data: {
  vehicleId: number;
  date?: string;
  odometer?: number | null;
  liters: number;
  rate: number;
  vendorId?: number | null;
  notes?: string | null;
}) {
  const totalCost = data.liters * data.rate;
  const record = await prisma.fuelLog.create({
    data: {
      vehicleId: data.vehicleId,
      date: data.date ? new Date(data.date) : new Date(),
      odometer: data.odometer ?? null,
      liters: data.liters,
      rate: data.rate,
      totalCost,
      vendorId: data.vendorId ?? null,
      notes: data.notes,
    },
  });
  return record;
}

export async function listMaintenances(opts: { limit?: number } = {}) {
  return prisma.vehicleMaintenance.findMany({
    include: { vehicle: { select: { id: true, regNo: true } } },
    orderBy: { date: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createMaintenance(data: {
  vehicleId: number;
  date?: string;
  type: string;
  description: string;
  cost: number;
  vendorId?: number | null;
  nextDueKm?: number | null;
  status?: string;
}) {
  return prisma.vehicleMaintenance.create({
    data: {
      vehicleId: data.vehicleId,
      date: data.date ? new Date(data.date) : new Date(),
      type: data.type,
      description: data.description,
      cost: data.cost,
      vendorId: data.vendorId ?? null,
      nextDueKm: data.nextDueKm ?? null,
      status: data.status ?? "COMPLETED",
    },
  });
}
