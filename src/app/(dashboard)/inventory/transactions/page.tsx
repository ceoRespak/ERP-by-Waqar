import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listStockTransactions } from "@/server/inventory/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AdjustmentForm } from "@/components/inventory/adjustment-form";
import { TransferForm } from "@/components/inventory/transfer-form";
import { formatDate, formatNumber } from "@/lib/utils";
import { parsePage } from "@/lib/pagination";
import { ArrowLeftRight } from "lucide-react";

const PAGE_SIZE = 20;

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
  { key: "refType", header: "Reference", render: (r) => (r.refType ? `${r.refType}${r.refId ? `#${r.refId}` : ""}` : "—") },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const params = await searchParams;
  const page = parsePage(params.page);
  const [transactions, items, warehouses] = await Promise.all([
    listStockTransactions(),
    prisma.item.findMany({ select: { id: true, code: true, name: true, unit: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transactions" description="Full movement history: receipts, issues, adjustments and transfers." hero icon={ArrowLeftRight} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={transactions} rowKey={(r) => r.id} emptyMessage="No transactions yet." page={page} pageSize={PAGE_SIZE} baseHref="/inventory/transactions" headerClassName="inv-table-head" zebra />
        </div>
        <div className="space-y-6">
          <AdjustmentForm items={items} warehouses={warehouses} />
          <TransferForm items={items} warehouses={warehouses} />
        </div>
      </div>
    </div>
  );
}
