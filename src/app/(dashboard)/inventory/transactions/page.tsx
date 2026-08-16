import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listStockTransactions } from "@/server/inventory/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AdjustmentForm } from "@/components/inventory/adjustment-form";
import { formatDate, formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listStockTransactions>>[number];

const columns: Column<Row>[] = [
  { key: "transactionNo", header: "Txn No", render: (r) => <span className="font-medium">{r.transactionNo}</span> },
  { key: "item", header: "Item", render: (r) => r.item.name },
  { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse.name },
  {
    key: "type",
    header: "Type",
    render: (r) => <Badge variant={statusVariant(r.type)}>{r.type.replace("_", " ")}</Badge>,
  },
  { key: "quantity", header: "Qty", className: "text-right", render: (r) => formatNumber(r.quantity) },
  { key: "refType", header: "Reference", render: (r) => (r.refType ? `${r.refType}#${r.refId ?? ""}` : "—") },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

export default async function TransactionsPage() {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const [transactions, items, warehouses] = await Promise.all([
    listStockTransactions(),
    prisma.item.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transactions" description="Full movement history: receipts, issues and adjustments." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={transactions} rowKey={(r) => r.id} emptyMessage="No transactions yet." />
        </div>
        <AdjustmentForm items={items} warehouses={warehouses} />
      </div>
    </div>
  );
}
