import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { VendorType } from "@prisma/client";

// =====================================================================
// VENDOR MANAGEMENT
// =====================================================================

export async function listVendors(opts: { limit?: number; type?: VendorType; status?: string } = {}) {
  return prisma.vendor.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      _count: { select: { purchaseOrders: true, evaluations: true } },
    },
    orderBy: { name: "asc" },
    take: opts.limit ?? 500,
  });
}

export async function createVendor(data: {
  code: string;
  name: string;
  type?: VendorType;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  ntn?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  notes?: string | null;
}) {
  const record = await prisma.vendor.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type ?? "SUPPLIER",
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      ntn: data.ntn ?? null,
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      notes: data.notes,
      status: "ACTIVE",
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.VENDORS, entity: "VENDOR", entityId: record.id, details: { code: record.code, name: record.name } });
  return record;
}

export async function listVendorEvaluations(vendorId?: number) {
  return prisma.vendorEvaluation.findMany({
    where: vendorId ? { vendorId } : undefined,
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function createVendorEvaluation(data: {
  vendorId: number;
  date?: string;
  criteria: string;
  score: number;
  remarks?: string | null;
  evaluatedBy?: string | null;
}) {
  return prisma.vendorEvaluation.create({
    data: {
      vendorId: data.vendorId,
      date: data.date ? new Date(data.date) : new Date(),
      criteria: data.criteria,
      score: data.score,
      remarks: data.remarks,
      evaluatedBy: data.evaluatedBy,
    },
  });
}

export async function listVendorDocuments(vendorId?: number) {
  return prisma.vendorDocument.findMany({
    where: vendorId ? { vendorId } : undefined,
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createVendorDocument(data: {
  vendorId: number;
  name: string;
  type?: string | null;
  fileUrl: string;
  expiryDate?: string | null;
}) {
  return prisma.vendorDocument.create({
    data: {
      vendorId: data.vendorId,
      name: data.name,
      type: data.type ?? null,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
  });
}
