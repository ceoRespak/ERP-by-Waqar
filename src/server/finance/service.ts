import { prisma } from "@/lib/db";
import { nextDocNo } from "@/server/docno";
import { submitForApproval } from "@/server/approval/service";
import { APPROVAL_ENTITY_TYPES, MODULES } from "@/lib/constants";
import { auditLog } from "@/server/audit";
import type { AccountType, PaymentMethod } from "@prisma/client";

// =====================================================================
// FINANCE: Chart of Accounts, Journal, Payments, Client Invoices
// =====================================================================

export async function listAccounts() {
  return prisma.account.findMany({ orderBy: [{ type: "asc" }, { code: "asc" }] });
}

export async function createAccount(data: {
  code: string;
  name: string;
  type: AccountType;
  parentId?: number | null;
  description?: string | null;
}) {
  return prisma.account.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      parentId: data.parentId ?? null,
      description: data.description,
    },
  });
}

export async function listJournalEntries(opts: { limit?: number } = {}) {
  return prisma.journalEntry.findMany({
    include: {
      lines: { include: { account: true, project: { select: { id: true, code: true, name: true } }, vendor: { select: { id: true, name: true } }, item: { select: { id: true, code: true, name: true, unit: true } } } },
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function getJournalEntry(id: number) {
  return prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: { include: { account: true, project: { select: { id: true, code: true, name: true } }, vendor: { select: { id: true, name: true } }, item: { select: { id: true, code: true, name: true, unit: true } } }, orderBy: { id: "asc" } },
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
      payment: { select: { id: true, paymentNo: true, type: true } },
    },
  });
}

export async function createJournalEntry(data: {
  date?: string;
  description: string;
  createdById?: number | null;
  vendorId?: number | null;
  projectId?: number | null;
  lines: { accountId: number; debit: number; credit: number; notes?: string; projectId?: number | null; vendorId?: number | null; itemId?: number | null }[];
}) {
  const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error("Journal entry is not balanced (debits must equal credits).");
  }
  const entryNo = await nextDocNo("entryNo", "JE", (args) => prisma.journalEntry.findFirst(args as any));
  const record = await prisma.journalEntry.create({
    data: {
      entryNo,
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      createdById: data.createdById ?? null,
      vendorId: data.vendorId ?? null,
      projectId: data.projectId ?? null,
      status: "DRAFT",
      lines: { create: data.lines },
    },
  });
  await auditLog({
    userId: data.createdById,
    action: "CREATE",
    module: MODULES.FINANCE,
    entity: "JOURNAL_ENTRY",
    entityId: record.id,
    details: { entryNo },
  });
  return record;
}

export async function submitJournalEntry(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.journalEntry.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Journal entry not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.JOURNAL_ENTRY,
    entityId: record.id,
    module: MODULES.FINANCE,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------
export async function listPayments(opts: { limit?: number; type?: string } = {}) {
  return prisma.payment.findMany({
    where: opts.type ? { type: opts.type } : undefined,
    include: {
      account: { select: { id: true, code: true, name: true } },
      counterAccount: { select: { id: true, code: true, name: true } },
      journalEntry: { select: { id: true, entryNo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

/**
 * Create a payment with full double-entry: every payment books a balanced
 * journal entry with two lines (cross-account + cash/bank account).
 *
 *   OUT (payment):  Debit  crossAccount (expense / payable / recipient)
 *                   Credit account      (cash / bank)
 *   IN  (receipt):  Debit  account      (cash / bank)
 *                   Credit crossAccount (income / receivable / payer)
 */
export async function createPayment(data: {
  type: "IN" | "OUT";
  amount: number;
  method: PaymentMethod;
  date?: string;
  accountId: number;
  counterAccountId: number;
  refType?: string | null;
  refId?: number | null;
  notes?: string | null;
  createdById?: number | null;
}) {
  if (!data.counterAccountId) {
    throw new Error("Cross account is required — every payment needs two sides for double-entry.");
  }
  const amount = Number(data.amount);
  if (!isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
  if (data.accountId === data.counterAccountId) {
    throw new Error("Cross account must be different from the cash/bank account.");
  }

  // Generate reference numbers OUTSIDE the transaction (see materials service —
  // nextDocNo runs its own transaction, nesting it deadlocks).
  const paymentNo = await nextDocNo("paymentNo", "PAY", (args) => prisma.payment.findFirst(args as any));
  const entryNo = await nextDocNo("entryNo", "JE", (args) => prisma.journalEntry.findFirst(args as any));

  const debit = data.type === "OUT" ? data.counterAccountId : data.accountId;
  const credit = data.type === "OUT" ? data.accountId : data.counterAccountId;
  const description =
    `${data.type === "OUT" ? "Payment out" : "Receipt in"} ${paymentNo}` +
    (data.notes ? ` — ${data.notes}` : "");

  const result = await prisma.$transaction(async (tx) => {
    const journal = await tx.journalEntry.create({
      data: {
        entryNo,
        date: data.date ? new Date(data.date) : new Date(),
        description,
        createdById: data.createdById ?? null,
        status: "POSTED",
        lines: {
          create: [
            { accountId: debit, debit: amount, credit: 0, notes: `${data.type === "OUT" ? "Payment (debit side)" : "Receipt (debit side)"}` },
            { accountId: credit, debit: 0, credit: amount, notes: `${data.type === "OUT" ? "Payment (credit side)" : "Receipt (credit side)"}` },
          ],
        },
      },
    });

    const record = await tx.payment.create({
      data: {
        paymentNo,
        type: data.type,
        amount,
        method: data.method,
        date: data.date ? new Date(data.date) : new Date(),
        accountId: data.accountId,
        counterAccountId: data.counterAccountId,
        refType: data.refType ?? null,
        refId: data.refId ?? null,
        notes: data.notes,
        status: "PENDING",
        journalEntryId: journal.id,
        createdById: data.createdById ?? null,
      },
    });
    return { record, journal };
  });

  await auditLog({
    userId: data.createdById,
    action: "CREATE",
    module: MODULES.FINANCE,
    entity: "PAYMENT",
    entityId: result.record.id,
    details: { paymentNo, entryNo, type: data.type, amount },
  });
  return result.record;
}

export async function submitPayment(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Payment not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.PAYMENT,
    entityId: record.id,
    module: MODULES.FINANCE,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}

// ---------------------------------------------------------------------
// Client Invoices (AR)
// ---------------------------------------------------------------------
export async function listClientInvoices(opts: { limit?: number } = {}) {
  return prisma.clientInvoice.findMany({
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
      lines: true,
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export async function createClientInvoice(data: {
  clientId: number;
  projectId?: number | null;
  date?: string;
  dueDate?: string | null;
  taxRate?: number;
  notes?: string | null;
  createdById?: number | null;
  lines: { description: string; quantity: number; unitPrice: number }[];
}) {
  let subtotal = 0;
  const lineItems = data.lines.map((l) => {
    const lineTotal = l.quantity * l.unitPrice;
    subtotal += lineTotal;
    return { description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal };
  });
  const taxAmount = (subtotal * (data.taxRate || 0)) / 100;
  const invoiceNo = await nextDocNo("invoiceNo", "INV", (args) => prisma.clientInvoice.findFirst(args as any));

  const record = await prisma.clientInvoice.create({
    data: {
      invoiceNo,
      clientId: data.clientId,
      projectId: data.projectId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      status: "UNPAID",
      notes: data.notes,
      lines: { create: lineItems },
    },
  });

  await auditLog({
    userId: data.createdById,
    action: "CREATE",
    module: MODULES.FINANCE,
    entity: "CLIENT_INVOICE",
    entityId: record.id,
    details: { invoiceNo },
  });
  return record;
}

export async function submitClientInvoice(params: { id: number; userId: number; userName: string }) {
  const record = await prisma.clientInvoice.findUnique({ where: { id: params.id } });
  if (!record) throw new Error("Invoice not found.");
  const request = await submitForApproval({
    entityType: APPROVAL_ENTITY_TYPES.CLIENT_INVOICE,
    entityId: record.id,
    module: MODULES.FINANCE,
    submittedById: params.userId,
    submittedByName: params.userName,
  });
  return { record, approvalRequest: request };
}
