import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { PurchaseOrderForm } from "@/components/procurement/purchase-order-form";

export default async function NewPurchaseOrderPage() {
  await requirePermission(PERMISSIONS.PROCUREMENT_CREATE);
  const [vendors, requisitions, projects, items] = await Promise.all([
    prisma.vendor.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.purchaseRequisition.findMany({
      where: { status: { in: ["APPROVED", "PENDING"] } },
      select: { id: true, prNo: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New Purchase Order" description="Create a PO, then submit it for approval." />
      <PurchaseOrderForm vendors={vendors} requisitions={requisitions} projects={projects} items={items} />
    </div>
  );
}
