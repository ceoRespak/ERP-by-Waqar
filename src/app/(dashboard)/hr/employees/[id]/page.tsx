import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getEmployeeDetail } from "@/server/hr/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  await requirePermission(PERMISSIONS.HR_READ);
  const employee = await getEmployeeDetail(Number(id));
  if (!employee) notFound();

  const attendanceStats = await prisma.attendance.findMany({ where: { employeeId: employee.id }, select: { status: true, totalHours: true } });
  const presentCount = attendanceStats.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const totalHours = attendanceStats.reduce((s, a) => s + a.totalHours.toNumber(), 0);

  const balanceColumns: Column<(typeof employee.leaveBalances)[number]>[] = [
    { key: "type", header: "Leave Type", render: (r) => r.leaveType.name },
    { key: "total", header: "Total", className: "text-right", render: (r) => formatNumber(r.total) },
    { key: "used", header: "Used", className: "text-right", render: (r) => formatNumber(r.used) },
    {
      key: "remaining",
      header: "Remaining",
      className: "text-right",
      render: (r) => <span className={r.total.toNumber() - r.used.toNumber() <= 0 ? "text-destructive" : ""}>{formatNumber(r.total.toNumber() - r.used.toNumber())}</span>,
    },
  ];

  const assignmentColumns: Column<(typeof employee.assignments)[number]>[] = [
    { key: "project", header: "Project", render: (r) => <span className="font-medium">{r.project.name}</span> },
    { key: "role", header: "Role", render: (r) => r.role ?? "—" },
    { key: "startDate", header: "From", render: (r) => formatDate(r.startDate) },
    { key: "endDate", header: "To", render: (r) => (r.endDate ? formatDate(r.endDate) : "—") },
    { key: "isActive", header: "Status", render: (r) => (r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={`${employee.firstName} ${employee.lastName}`} description={`${employee.empCode} · ${employee.designation?.name ?? "—"} · ${employee.department?.name ?? "—"}`} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{employee.employeeType.replace("_", " ")}</Badge>
          <Badge variant={statusVariant(employee.status)}>{employee.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Attendance Records</p><p className="mt-1 text-2xl font-bold">{attendanceStats.length}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Present / Late</p><p className="mt-1 text-2xl font-bold">{presentCount}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Hours</p><p className="mt-1 text-2xl font-bold">{formatNumber(totalHours)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Leave Balances</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={balanceColumns} rows={employee.leaveBalances} rowKey={(r) => r.id} emptyMessage="No leave balances configured." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Project Assignments</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={assignmentColumns} rows={employee.assignments} rowKey={(r) => r.id} emptyMessage="Not assigned to any project yet." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">CNIC</span><span className="font-mono">{employee.cnic ?? "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Phone</span><span>{employee.phone ?? "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span>{employee.email ?? "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Joining</span><span>{employee.joiningDate ? formatDate(employee.joiningDate) : "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Basic Salary</span><span>{formatMoney(employee.basicSalary)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Allowances</span><span>{formatMoney(employee.allowances)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Daily Wage</span><span>{formatMoney(employee.dailyWage)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Current Project</span><span>{employee.currentProject?.name ?? "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Bank</span><span>{employee.bankName ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{employee.bankAccount ?? "—"}</span></div>
            </CardContent>
          </Card>

          <Link href="/hr/employees" className="inline-block text-sm text-primary hover:underline">
            ← Back to Employees
          </Link>
        </div>
      </div>
    </div>
  );
}
