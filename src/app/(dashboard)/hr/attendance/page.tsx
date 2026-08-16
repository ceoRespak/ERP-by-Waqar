import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAttendance } from "@/server/hr/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AttendanceForm } from "@/components/hr/attendance-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAttendance>>[number];

const columns: Column<Row>[] = [
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "employee", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
  { key: "checkIn", header: "In", render: (r) => (r.checkIn ? formatDate(r.checkIn).split(",")[1]?.trim() ?? "—" : "—") },
  { key: "checkOut", header: "Out", render: (r) => (r.checkOut ? formatDate(r.checkOut).split(",")[1]?.trim() ?? "—" : "—") },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function AttendancePage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [attendance, employees] = await Promise.all([
    listAttendance(),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, empCode: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Daily check-in / check-out and attendance status." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={attendance} rowKey={(r) => r.id} emptyMessage="No attendance records yet." />
        </div>
        <AttendanceForm employees={employees} />
      </div>
    </div>
  );
}
