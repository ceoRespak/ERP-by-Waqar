import { prisma } from "@/lib/db";
import { auditLog } from "@/server/audit";
import { MODULES } from "@/lib/constants";
import type { VendorType } from "@prisma/client";

// =====================================================================
// VENDOR MANAGEMENT
// =====================================================================

/** Reserved code of the default "Vendors Payable" account in the chart of accounts. */
export const DEFAULT_PAYABLE_ACCOUNT_CODE = "2010";

/**
 * Resolve the default "Vendors Payable" account, creating it on first use if it
 * does not exist yet. Every vendor is linked to this account so that payables
 * are always booked to a consistent liability account.
 */
export async function getOrCreatePayableAccount() {
  const existing = await prisma.account.findFirst({
    where: { code: DEFAULT_PAYABLE_ACCOUNT_CODE },
  });
  if (existing) return existing;
  return prisma.account.create({
    data: {
      code: DEFAULT_PAYABLE_ACCOUNT_CODE,
      name: "Vendors Payable",
      type: "LIABILITY",
      description: "Default payable account linked to all vendors",
    },
  });
}

export async function listVendors(opts: { limit?: number; type?: VendorType; status?: string } = {}) {
  return prisma.vendor.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      _count: { select: { purchaseOrders: true, evaluations: true } },
      payableAccount: { select: { id: true, code: true, name: true } },
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
  payableAccountId?: number | null;
}) {
  // Auto-link the vendor to the default "Vendors Payable" account (unless an
  // explicit payable account was provided).
  const payableAccountId =
    data.payableAccountId ?? (await getOrCreatePayableAccount()).id;

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
      payableAccountId,
    },
  });
  await auditLog({ action: "CREATE", module: MODULES.VENDORS, entity: "VENDOR", entityId: record.id, details: { code: record.code, name: record.name, payableAccountId } });
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
