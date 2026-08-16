import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listRequisitions } from "@/server/procurement/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listRequisitions>>[number];

const columns: Column<Row>[] = [
  {
    key: "prNo",
    header: "PR No",
    render: (r) => <span className="font-medium">{r.prNo}</span>,
  },
  { key: "title", header: "Title" },
  { key: "requestedByName", header: "Requested By" },
  { key: "department", header: "Department", render: (r) => r.department?.name ?? "—" },
  {
    key: "total",
    header: "Est. Total",
    className: "text-right",
    render: (r) => formatMoney(r.items.reduce((s, i) => s + i.estimatedCost.toNumber(), 0)),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (r) =>
      r.status === "DRAFT" || r.status === "REJECTED" ? (
        <SubmitToApprovalButton apiPath={`/api/procurement/requisitions/${r.id}/submit`} />
      ) : null,
  },
];

export default async function RequisitionsPage() {
  await requirePermission(PERMISSIONS.PROCUREMENT_READ);
  const requisitions = await listRequisitions();

  return (
    <div>
      <PageHeader
        title="Purchase Requisitions"
        description="Requests for materials or services, routed through the approval workflow."
        actionHref="/procurement/requisitions/new"
        actionLabel="New Requisition"
      />
      <DataTable
        columns={columns}
        rows={requisitions}
        rowKey={(r) => r.id}
        emptyMessage="No requisitions yet. Create your first one."
      />
    </div>
  );
}
