import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { stockLevels } from "@/server/inventory/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof stockLevels>>[number];

const columns: Column<Row>[] = [
  { key: "item", header: "Item", render: (r) => (
    <>
      <span className="font-medium">{r.item.name}</span>
      <span className="block text-xs text-muted-foreground">{r.item.code}</span>
    </>
  ) },
  { key: "category", header: "Category", render: (r) => r.item.category?.name ?? "—" },
  { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse.name },
  { key: "quantity", header: "On Hand", className: "text-right", render: (r) => formatNumber(r.quantity) },
  {
    key: "status",
    header: "Status",
    render: (r) =>
      r.quantity.toNumber() <= 0 ? (
        <Badge variant="destructive">Out of stock</Badge>
      ) : r.quantity.toNumber() <= r.item.reorderLevel.toNumber() ? (
        <Badge variant="warning">Low stock</Badge>
      ) : (
        <Badge variant="success">OK</Badge>
      ),
  },
];

export default async function StockPage() {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const stock = await stockLevels();

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        description="On-hand quantities per item and warehouse. Stock updates on GRN receipts and adjustments."
        actionHref="/inventory/transactions"
        actionLabel="Adjust Stock"
      />
      <DataTable columns={columns} rows={stock} rowKey={(r) => r.id} emptyMessage="No stock recorded yet — receive goods against a PO or add opening stock." />
    </div>
  );
}
