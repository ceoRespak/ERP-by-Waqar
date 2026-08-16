import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listGrns } from "@/server/procurement/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listGrns>>[number];

const columns: Column<Row>[] = [
  { key: "grnNo", header: "GRN No", render: (r) => <span className="font-medium">{r.grnNo}</span> },
  { key: "po", header: "Purchase Order", render: (r) => r.po.poNo },
  { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse?.name ?? "Main Store" },
  {
    key: "items",
    header: "Items",
    render: (r) => formatNumber(r.items.length),
  },
  {
    key: "qty",
    header: "Total Qty",
    className: "text-right",
    render: (r) => formatNumber(r.items.reduce((s, i) => s + i.receivedQty.toNumber(), 0)),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "receivedDate", header: "Date", render: (r) => formatDate(r.receivedDate) },
];

export default async function GrnPage() {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const grns = await listGrns();

  return (
    <div>
      <PageHeader
        title="Goods Receipt Notes"
        description="Received goods against purchase orders, posted directly to inventory."
        actionHref="/procurement/grn/new"
        actionLabel="New Goods Receipt"
      />
      <DataTable columns={columns} rows={grns} rowKey={(r) => r.id} emptyMessage="No goods receipts yet." />
    </div>
  );
}
