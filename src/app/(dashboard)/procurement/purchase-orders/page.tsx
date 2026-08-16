import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPurchaseOrders } from "@/server/procurement/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listPurchaseOrders>>[number];

const columns: Column<Row>[] = [
  { key: "poNo", header: "PO No", render: (r) => <span className="font-medium">{r.poNo}</span> },
  { key: "vendorName", header: "Vendor" },
  {
    key: "project",
    header: "Project",
    render: (r) => (r.project ? `${r.project.code} — ${r.project.name}` : "—"),
  },
  {
    key: "total",
    header: "Total",
    className: "text-right",
    render: (r) => formatMoney(r.total),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "orderDate", header: "Date", render: (r) => formatDate(r.orderDate) },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (r) =>
      r.status === "DRAFT" || r.status === "REJECTED" ? (
        <SubmitToApprovalButton apiPath={`/api/procurement/purchase-orders/${r.id}/submit`} />
      ) : null,
  },
];

export default async function PurchaseOrdersPage() {
  await requirePermission(PERMISSIONS.PROCUREMENT_READ);
  const purchaseOrders = await listPurchaseOrders();

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Approved orders to vendors. Receiving happens on the GRN screen."
        actionHref="/procurement/purchase-orders/new"
        actionLabel="New Purchase Order"
      />
      <DataTable
        columns={columns}
        rows={purchaseOrders}
        rowKey={(r) => r.id}
        emptyMessage="No purchase orders yet."
      />
    </div>
  );
}
