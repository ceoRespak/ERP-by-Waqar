import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { GrnForm } from "@/components/procurement/grn-form";

export default async function NewGrnPage() {
  await requirePermission(PERMISSIONS.INVENTORY_CREATE);
  const [pos, warehouses] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const purchaseOrders = pos.map((po) => ({
    id: po.id,
    poNo: po.poNo,
    vendorName: po.vendorName,
    items: po.items.map((i) => ({
      id: i.id,
      itemId: i.itemId,
      description: i.description,
      quantity: i.quantity.toNumber(),
      receivedQty: i.receivedQty.toNumber(),
    })),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New Goods Receipt" description="Receive goods against an approved purchase order — stock is updated automatically." />
      <GrnForm purchaseOrders={purchaseOrders} warehouses={warehouses} />
    </div>
  );
}
