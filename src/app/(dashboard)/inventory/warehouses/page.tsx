import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { WarehouseForm } from "@/components/inventory/warehouse-form";
import { Warehouse } from "lucide-react";

type Row = Awaited<ReturnType<typeof prisma.warehouse.findMany>>[number] & { _count: { stockLevels: number } };

const columns: Column<Row>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-medium">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "location", header: "Location", render: (r) => r.location ?? "—" },
  { key: "_count", header: "Stock Lines", className: "text-right", render: (r) => r._count.stockLevels },
];

export default async function WarehousesPage() {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { stockLevels: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" description="Storage locations used across the ERP." hero icon={Warehouse} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={warehouses as Row[]} rowKey={(r) => r.id} emptyMessage="No warehouses yet — add your first store location." headerClassName="inv-table-head" zebra />
        </div>
        <WarehouseForm />
      </div>
    </div>
  );
}
