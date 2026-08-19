import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAttendance } from "@/server/hr/attendance";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AttendanceForm } from "@/components/hr/attendance-form";
import { ApprovalActions } from "@/components/hr/approval-actions";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAttendance>>[number];

const columns: Column<Row>[] = [
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "employee", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
  { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
  { key: "checkIn", header: "In", render: (r) => (r.checkIn ? formatDate(r.checkIn).split(",")[1]?.trim() ?? "—" : "—") },
  { key: "checkOut", header: "Out", render: (r) => (r.checkOut ? formatDate(r.checkOut).split(",")[1]?.trim() ?? "—" : "—") },
  { key: "totalHours", header: "Hrs", className: "text-right", render: (r) => r.totalHours.toNumber() },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  {
    key: "approval",
    header: "Approval",
    render: (r) => <Badge variant={statusVariant(r.approvalStatus)}>{r.approvalStatus.replace("_", " ")}</Badge>,
  },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (r) => <ApprovalActions kind="attendance" id={r.id} status={r.approvalStatus} />,
  },
];

export default async function AttendancePage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [attendance, employees, projects] = await Promise.all([
    listAttendance(),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, empCode: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
    prisma.hrProject.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Daily check-in / check-out, status and PM → HR approval." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={attendance} rowKey={(r) => r.id} emptyMessage="No attendance records yet." />
        </div>
        <div>
          <AttendanceForm employees={employees} projects={projects} />
        </div>
      </div>
    </div>
  );
}
