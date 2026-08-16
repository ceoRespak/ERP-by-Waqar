import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listSubmittals } from "@/server/sites/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { SubmittalForm } from "@/components/sites/submittal-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listSubmittals>>[number];

const columns: Column<Row>[] = [
  { key: "submittalNo", header: "Submittal No", render: (r) => <span className="font-medium">{r.submittalNo}</span> },
  { key: "project", header: "Project", render: (r) => `${r.project.code} — ${r.project.name}` },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "title", header: "Title" },
  { key: "category", header: "Category", render: (r) => (r.category ? <Badge variant="secondary">{r.category}</Badge> : "—") },
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
        <SubmitToApprovalButton apiPath={`/api/sites/submittals/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function SubmittalsPage() {
  await requirePermission(PERMISSIONS.SITES_READ);
  const [submittals, projects] = await Promise.all([
    listSubmittals(),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Submittals" description="Material, drawing and specification submittals for approval." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={submittals} rowKey={(r) => r.id} emptyMessage="No submittals yet." />
        </div>
        <SubmittalForm projects={projects} />
      </div>
    </div>
  );
}
