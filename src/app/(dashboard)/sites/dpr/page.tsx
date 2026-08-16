import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDprs } from "@/server/sites/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { DprForm } from "@/components/sites/dpr-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listDprs>>[number];

const columns: Column<Row>[] = [
  { key: "dprNo", header: "DPR No", render: (r) => <span className="font-medium">{r.dprNo}</span> },
  { key: "project", header: "Project", render: (r) => `${r.project.code} — ${r.project.name}` },
  { key: "reportDate", header: "Date", render: (r) => formatDate(r.reportDate) },
  {
    key: "workDone",
    header: "Work Done",
    render: (r) => (
      <span className="line-clamp-1 max-w-[260px] text-muted-foreground">{r.workDone}</span>
    ),
  },
  { key: "preparedByName", header: "Prepared By", render: (r) => r.preparedByName ?? "—" },
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
        <SubmitToApprovalButton apiPath={`/api/sites/dpr/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function DprPage() {
  await requirePermission(PERMISSIONS.SITES_READ);
  const [dprs, projects] = await Promise.all([
    listDprs(),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Progress Reports" description="Site progress, manpower, equipment and issues — submitted for approval." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={dprs} rowKey={(r) => r.id} emptyMessage="No DPRs yet." />
        </div>
        <DprForm projects={projects} />
      </div>
    </div>
  );
}
