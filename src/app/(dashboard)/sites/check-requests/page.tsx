import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCheckRequests } from "@/server/sites/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { CheckRequestForm } from "@/components/sites/check-request-form";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listCheckRequests>>[number];

const columns: Column<Row>[] = [
  { key: "requestNo", header: "Request No", render: (r) => <span className="font-medium">{r.requestNo}</span> },
  { key: "project", header: "Project", render: (r) => `${r.project.code} — ${r.project.name}` },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "payeeName", header: "Payee" },
  { key: "description", header: "Description", render: (r) => <span className="line-clamp-1 max-w-[220px] text-muted-foreground">{r.description}</span> },
  { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (r) =>
      r.status === "DRAFT" || r.status === "REJECTED" ? (
        <SubmitToApprovalButton apiPath={`/api/sites/check-requests/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function CheckRequestsPage() {
  await requirePermission(PERMISSIONS.SITES_READ);
  const [checkRequests, projects] = await Promise.all([
    listCheckRequests(),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Check Requests" description="Site payment requests routed through multi-level approval." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={checkRequests} rowKey={(r) => r.id} emptyMessage="No check requests yet." />
        </div>
        <CheckRequestForm projects={projects} />
      </div>
    </div>
  );
}
