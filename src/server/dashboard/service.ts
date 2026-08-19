import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side helper that gathers KPI counts for the dashboard.
 * Uses a single session check.
 */
export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [pendingApprovals, requisitionCount, poCount, employeeCount, activeProjects, vehicleCount, vendorCount] =
    await Promise.all([
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
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
