import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { countPendingApprovalsForUser } from "@/server/approval/service";

/**
 * Server-side helper that gathers KPI counts for the dashboard.
 * Uses a single session check.
 */
export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const [pendingApprovals, requisitionCount, poCount, employeeCount, activeProjects, vehicleCount, vendorCount] =
    await Promise.all([
      countPendingApprovalsForUser(userId),
      prisma.purchaseRequisition.count(),
      prisma.purchaseOrder.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.vendor.count(),
    ]);

  // Low / empty stock: quantity at or below the item's reorder level.
  const allStock = await prisma.stockLevel.findMany({
    take: 200,
    include: { item: true, warehouse: true },
  });
  const lowStockItems = allStock
    .filter((s) => s.quantity.toNumber() <= s.item.reorderLevel.toNumber())
    .slice(0, 10);

  const [
    openBudgetAlerts,
    openNcrs,
    openIncidents,
    docsExpiring,
    openMaterialRequests,
    pendingVariations,
    pendingIpcs,
    openRisks,
  ] = await Promise.all([
    prisma.costAlert.count({ where: { resolved: false } }),
    prisma.nCR.count({ where: { status: { not: "CLOSED" } } }),
    prisma.safetyIncident.count({ where: { investigationStatus: { not: "CLOSED" } } }),
    prisma.document.count({
      where: {
        status: { not: "OBSOLETE" },
        expiryDate: { not: null, lte: new Date(Date.now() + 45 * 86400000), gte: new Date() },
      },
    }),
    prisma.materialRequest.count({ where: { status: { in: ["DRAFT", "PENDING", "APPROVED"] } } }),
    prisma.variationOrder.count({ where: { status: "PENDING" } }),
    prisma.iPC.count({ where: { status: "PENDING" } }),
    prisma.riskAssessment.count({ where: { status: "OPEN", riskRating: { gte: 15 } } }),
  ]);

  const recentApprovals = await prisma.approvalRequest.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: { chain: true },
  });

  return {
    stats: {
      pendingApprovals,
      requisitionCount,
      poCount,
      lowStockCount: lowStockItems.length,
      employeeCount,
      activeProjects,
      vehicleCount,
      vendorCount,
      openBudgetAlerts,
      openNcrs,
      openIncidents,
      docsExpiring,
      openMaterialRequests,
      pendingVariations,
      pendingIpcs,
      openRisks,
    },
    lowStockItems,
    recentApprovals,
  };
}

/**
 * Financial KPIs + ranked lists for the dashboard.
 * Receivables/payables come from open invoices/bills minus payments already
 * received/made; "most sold" uses inventory issues (NO bill/line records).
 */
export async function getFinancialOverview() {
  const [
    openInvoices,
    invoicePayments,
    openBills,
    billPayments,
    recentTransactions,
    purchasedGroups,
    soldGroups,
    expenseGroups,
  ] = await Promise.all([
    prisma.clientInvoice.findMany({ where: { status: { in: ["UNPAID", "PARTIAL"] } }, select: { id: true, total: true } }),
    prisma.payment.findMany({
      where: { refType: "CLIENT_INVOICE", refId: { not: null }, status: { in: ["PAID", "APPROVED"] } },
      select: { refId: true, amount: true },
    }),
    prisma.supplierInvoice.findMany({ where: { status: { in: ["UNPAID", "PARTIAL"] } }, select: { id: true, total: true } }),
    prisma.payment.findMany({
      where: { refType: "SUPPLIER_INVOICE", refId: { not: null }, status: { in: ["PAID", "APPROVED"] } },
      select: { refId: true, amount: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { account: { select: { id: true, code: true, name: true } } },
    }),
    prisma.gRNItem.groupBy({
      by: ["itemId"],
      where: { itemId: { not: null } },
      _sum: { receivedQty: true },
      orderBy: { _sum: { receivedQty: "desc" } },
      take: 8,
    }),
    prisma.stockTransaction.groupBy({
      by: ["itemId"],
      where: { type: "ISSUE" },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.payment.groupBy({
      by: ["createdById"],
      where: { type: "OUT", createdById: { not: null }, status: { in: ["PAID", "APPROVED"] } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 8,
    }),
  ]);

  // Receivables = open invoice totals minus payments already received.
  const openInvoiceIds = new Set(openInvoices.map((i) => i.id));
  const paidOnInvoices = invoicePayments
    .filter((p) => p.refId && openInvoiceIds.has(p.refId))
    .reduce((s, p) => s + p.amount.toNumber(), 0);
  const receivables = openInvoices.reduce((s, i) => s + i.total.toNumber(), 0) - paidOnInvoices;

  // Payables = open supplier bill totals minus payments already made.
  const openBillIds = new Set(openBills.map((b) => b.id));
  const paidOnBills = billPayments
    .filter((p) => p.refId && openBillIds.has(p.refId))
    .reduce((s, p) => s + p.amount.toNumber(), 0);
  const payables = openBills.reduce((s, b) => s + b.total.toNumber(), 0) - paidOnBills;

  // Resolve item names for purchased / sold lists.
  const itemIds = [
    ...new Set(
      [...purchasedGroups.map((g) => g.itemId), ...soldGroups.map((g) => g.itemId)].filter((x): x is number => x != null)
    ),
  ];
  const items = itemIds.length
    ? await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, code: true, name: true } })
    : [];
  const itemMap = new Map(items.map((i) => [i.id, i]));

  // Resolve user names for expenses-by-user.
  const userIds = expenseGroups.map((g) => g.createdById).filter((x): x is number => x != null);
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return {
    receivables,
    payables,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      paymentNo: t.paymentNo,
      type: t.type,
      amount: t.amount.toNumber(),
      method: t.method,
      status: t.status,
      date: t.date,
      accountName: t.account?.name ?? null,
    })),
    mostPurchased: purchasedGroups.map((g) => {
      const it = g.itemId ? itemMap.get(g.itemId) : undefined;
      return {
        id: g.itemId,
        code: it?.code ?? null,
        name: it?.name ?? `Item #${g.itemId}`,
        qty: g._sum.receivedQty?.toNumber() ?? 0,
      };
    }),
    mostSold: soldGroups.map((g) => {
      const it = g.itemId ? itemMap.get(g.itemId) : undefined;
      return {
        id: g.itemId,
        code: it?.code ?? null,
        name: it?.name ?? `Item #${g.itemId}`,
        qty: g._sum.quantity?.toNumber() ?? 0,
      };
    }),
    expensesByUser: expenseGroups.map((g) => ({
      userId: g.createdById,
      name: g.createdById != null ? (userMap.get(g.createdById) ?? "Unknown") : "Unknown",
      amount: g._sum.amount?.toNumber() ?? 0,
    })),
  };
}
