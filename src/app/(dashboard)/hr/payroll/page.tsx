import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPayrollRuns } from "@/server/hr/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { PayrollForm } from "@/components/hr/payroll-form";
import { formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listPayrollRuns>>[number];

const columns: Column<Row>[] = [
  { key: "period", header: "Period", render: (r) => <span className="font-medium">{r.period}</span> },
  { key: "items", header: "Employees", className: "text-right", render: (r) => r.items.length },
  {
    key: "total",
    header: "Gross Pay",
    className: "text-right",
    render: (r) => formatMoney(r.items.reduce((s, i) => s + i.netSalary.toNumber(), 0)),
  },
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
        <SubmitToApprovalButton apiPath={`/api/hr/payroll/${r.id}/submit`} label="Submit for Approval" />
      ) : null,
  },
];

export default async function PayrollPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const runs = await listPayrollRuns();

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" description="Monthly payroll runs generated from active employee salaries." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={runs} rowKey={(r) => r.id} emptyMessage="No payroll runs yet." />
        </div>
        <PayrollForm />
      </div>
    </div>
  );
}
