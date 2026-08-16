import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendorEvaluations } from "@/server/vendors/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EvaluationForm } from "@/components/vendors/evaluation-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listVendorEvaluations>>[number];

const columns: Column<Row>[] = [
  { key: "vendor", header: "Vendor", render: (r) => r.vendor.name },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "criteria", header: "Criteria", render: (r) => <Badge variant="secondary">{r.criteria}</Badge> },
  { key: "score", header: "Score", className: "text-right", render: (r) => (
    <span className={`font-semibold ${r.score >= 8 ? "text-emerald-600" : r.score >= 5 ? "text-amber-600" : "text-destructive"}`}>{r.score}/10</span>
  ) },
  { key: "evaluatedBy", header: "By", render: (r) => r.evaluatedBy ?? "—" },
];

export default async function EvaluationsPage() {
  await requirePermission(PERMISSIONS.VENDORS_READ);
  const [evaluations, vendors] = await Promise.all([
    listVendorEvaluations(),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Evaluations" description="Score vendors on quality, price, delivery and service." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={evaluations} rowKey={(r) => r.id} emptyMessage="No evaluations yet." />
        </div>
        <EvaluationForm vendors={vendors} />
      </div>
    </div>
  );
}
