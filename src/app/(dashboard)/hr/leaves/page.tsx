import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLeaveRequests } from "@/server/hr/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { LeaveForm } from "@/components/hr/leave-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listLeaveRequests>>[number];

const columns: Column<Row>[] = [
  { key: "employee", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
  { key: "leaveType", header: "Type", render: (r) => <Badge variant="secondary">{r.leaveType}</Badge> },
  { key: "fromDate", header: "From", render: (r) => formatDate(r.fromDate) },
  { key: "toDate", header: "To", render: (r) => formatDate(r.toDate) },
  { key: "days", header: "Days", className: "text-right", render: (r) => r.days.toNumber() },
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
        <SubmitToApprovalButton apiPath={`/api/hr/leaves/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function LeavesPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [leaves, employees] = await Promise.all([
    listLeaveRequests(),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, empCode: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Requests" description="Leave applications routed through the approval workflow." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={leaves} rowKey={(r) => r.id} emptyMessage="No leave requests yet." />
        </div>
        <LeaveForm employees={employees} />
      </div>
    </div>
  );
}
