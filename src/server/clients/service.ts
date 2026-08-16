import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { ClientType, ProjectStatus } from "@prisma/client";

// =====================================================================
// CLIENT & PROJECT MANAGEMENT
// =====================================================================

export async function listClients(opts: { limit?: number; status?: string } = {}) {
  return prisma.client.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      _count: { select: { projects: true, contracts: true, invoices: true } },
    },
    orderBy: { name: "asc" },
    take: opts.limit ?? 500,
  });
}

export async function createClient(data: {
  code: string;
  name: string;
  type?: ClientType;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  ntn?: string | null;
}) {
  const record = await prisma.client.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type ?? "CORPORATE",
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      ntn: data.ntn ?? null,
      status: "ACTIVE",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.CLIENTS, entity: "CLIENT", entityId: record.id, details: { code: record.code, name: record.name } });
  return record;
}

export async function listProjects(opts: { limit?: number; status?: ProjectStatus } = {}) {
  return prisma.project.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      client: { select: { id: true, name: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { dprs: true, checkRequests: true, submittals: true, transmittals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createProject(data: {
  code: string;
  name: string;
  clientId?: number | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  status?: ProjectStatus;
  managerEmployeeId?: number | null;
  description?: string | null;
}) {
  const record = await prisma.project.create({
    data: {
      code: data.code,
      name: data.name,
      clientId: data.clientId ?? null,
      location: data.location ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget ?? 0,
      status: data.status ?? "PLANNING",
      managerEmployeeId: data.managerEmployeeId ?? null,
      description: data.description,
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.CLIENTS, entity: "PROJECT", entityId: record.id, details: { code: record.code, name: record.name } });
  return record;
}

export async function listContracts(opts: { limit?: number } = {}) {
  return prisma.clientContract.findMany({
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createContract(data: {
  clientId: number;
  projectId?: number | null;
  contractNo: string;
  title: string;
  value: number;
  startDate: string;
  endDate?: string | null;
  status?: string;
}) {
  return prisma.clientContract.create({
    data: {
      clientId: data.clientId,
      projectId: data.projectId ?? null,
      contractNo: data.contractNo,
      title: data.title,
      value: data.value,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function listClientsOptions() {
  return prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export async function listProjectsOptions() {
  return prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } });
}
