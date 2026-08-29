import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listStockTransactions } from "@/server/inventory/service";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AdjustmentForm } from "@/components/inventory/adjustment-form";
import { TransferForm } from "@/components/inventory/transfer-form";
import { formatDate, formatNumber } from "@/lib/utils";
import { parsePage } from "@/lib/pagination";
import { ArrowLeftRight, Search } from "lucide-react";

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
  searchParams: Promise<{ page?: string; q?: string; type?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const params = await searchParams;
  const page = parsePage(params.page);
  const q = (params.q ?? "").trim().toLowerCase();
  const type = (params.type ?? "").trim();
  const [allTransactions, items, warehouses] = await Promise.all([
    listStockTransactions(),
    prisma.item.findMany({ select: { id: true, code: true, name: true, unit: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  let transactions = allTransactions;
  if (q) transactions = transactions.filter((r) => r.transactionNo.toLowerCase().includes(q) || r.item.name.toLowerCase().includes(q) || r.item.code.toLowerCase().includes(q));
  if (type) transactions = transactions.filter((r) => r.type === type);

  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (type) filterParams.set("type", type);
  const filterQs = filterParams.toString();
  const baseHref = `/inventory/transactions${filterQs ? `?${filterQs}` : ""}`;

  const TYPES = ["RECEIPT", "ISSUE", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"];

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transactions" description="Full movement history: receipts, issues, adjustments and transfers." hero icon={ArrowLeftRight} />

      <form method="get" action="/inventory/transactions" className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Search transactions</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by txn no or item..." className="pl-8" />
          </div>
        </div>
        <div className="space-y-1 sm:w-56">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select name="type" defaultValue={type}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">Filter</Button>
          {(q || type) && (
            <Link href="/inventory/transactions" className={buttonVariants({ variant: "ghost" })}>Clear</Link>
          )}
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={transactions} rowKey={(r) => r.id} emptyMessage="No transactions match your filters." page={page} pageSize={PAGE_SIZE} baseHref={baseHref} headerClassName="inv-table-head" zebra />
        </div>
        <div className="space-y-6">
          <AdjustmentForm items={items} warehouses={warehouses} />
          <TransferForm items={items} warehouses={warehouses} />
        </div>
      </div>
    </div>
  );
}
