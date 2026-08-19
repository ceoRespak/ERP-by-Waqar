import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLeaveTypes } from "@/server/hr/leaves";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { LeaveTypeForm } from "@/components/hr/leave-type-form";
import { formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listLeaveTypes>>[number];

const columns: Column<Row>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs font-medium">{r.code}</span> },
  { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "defaultTotal", header: "Default Total", className: "text-right", render: (r) => formatNumber(r.defaultTotal) },
  { key: "isPaid", header: "Paid", render: (r) => (r.isPaid ? <Badge variant="success">Paid</Badge> : <Badge variant="secondary">Unpaid</Badge>) },
  { key: "requiresDocument", header: "Doc", render: (r) => (r.requiresDocument ? "✓" : "—") },
  { key: "isActive", header: "Status", render: (r) => (r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>) },
];

export default async function LeaveTypesPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const leaveTypes = await listLeaveTypes();

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Types" description="Configurable leave categories with per-employee balances." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={leaveTypes} rowKey={(r) => r.id} emptyMessage="No leave types yet." />
        </div>
        <LeaveTypeForm />
      </div>
    </div>
  );
}
