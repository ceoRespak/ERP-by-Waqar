import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { attendanceReport, leaveReport, wagesReport, salaryReport } from "@/server/hr/reports";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

const VIEWS = ["attendance", "leaves", "wages", "salary"] as const;
type View = (typeof VIEWS)[number];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; year?: string; projectId?: string }>;
}) {
  await requirePermission(PERMISSIONS.HR_READ);
  const params = await searchParams;
  const view: View = (VIEWS as readonly string[]).includes(params.view ?? "") ? (params.view as View) : "salary";
  const month = Number(params.month) || new Date().getMonth() + 1;
  const year = Number(params.year) || new Date().getFullYear();
  const projectId = params.projectId ? Number(params.projectId) : undefined;
  const [projects] = await Promise.all([prisma.hrProject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const prevMonth = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const nextMonth = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  const base = `/hr/reports?view=${view}&month=${month}&year=${year}`;

  const tab = (v: View, label: string) => {
    const href = `/hr/reports?view=${v}&month=${month}&year=${year}${projectId ? `&projectId=${projectId}` : ""}`;
    const active = view === v;
    return (
      <Link key={v} href={href} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
        {label}
      </Link>
    );
  };

  let content: React.ReactNode = null;
  if (view === "attendance") {
    const report = await attendanceReport(month, year, { projectId });
    const cols: Column<(typeof report.rows)[number]>[] = [
      { key: "name", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
      { key: "present", header: "Present", className: "text-right", render: (r) => r.present },
      { key: "late", header: "Late", className: "text-right", render: (r) => r.late },
      { key: "halfDay", header: "Half Day", className: "text-right", render: (r) => r.halfDay },
      { key: "absent", header: "Absent", className: "text-right", render: (r) => r.absent },
      { key: "totalDays", header: "Days", className: "text-right", render: (r) => r.totalDays },
      { key: "percent", header: "Attendance %", className: "text-right", render: (r) => `${r.presentPercent}%` },
      { key: "hours", header: "Hours", className: "text-right", render: (r) => formatNumber(r.totalHours) },
    ];
    content = (
      <>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Records</p><p className="mt-1 text-2xl font-bold">{report.totalRecords}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Employees</p><p className="mt-1 text-2xl font-bold">{report.rows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Avg Attendance</p><p className="mt-1 text-2xl font-bold">{report.rows.length ? `${Math.round(report.rows.reduce((s, r) => s + r.presentPercent, 0) / report.rows.length)}%` : "—"}</p></CardContent></Card>
        <Card className="lg:col-span-3"><CardHeader><CardTitle className="text-base">Attendance by Employee — {monthNames[month - 1]} {year}</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={cols} rows={report.rows} rowKey={(r) => r.employee.id} emptyMessage="No attendance records this month." /></CardContent></Card>
      </>
    );
  } else if (view === "leaves") {
    const report = await leaveReport({});
    const cols: Column<(typeof report.leaves)[number]>[] = [
      { key: "emp", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
      { key: "type", header: "Type", render: (r) => r.leaveTypeConfig?.name ?? r.leaveType },
      { key: "from", header: "From", render: (r) => r.fromDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
      { key: "to", header: "To", render: (r) => r.toDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
      { key: "days", header: "Days", className: "text-right", render: (r) => r.days.toNumber() },
      { key: "status", header: "Status", render: (r) => r.status.replace("_", " ") },
    ];
    content = (
      <>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Leaves</p><p className="mt-1 text-2xl font-bold">{report.totalLeaves}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Days</p><p className="mt-1 text-2xl font-bold">{report.totalDays}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Leave Types</p><p className="mt-1 text-2xl font-bold">{report.byType.length}</p></CardContent></Card>
        <Card className="lg:col-span-3"><CardHeader><CardTitle className="text-base">Leave Requests</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={cols} rows={report.leaves} rowKey={(r) => r.id} emptyMessage="No leave requests." /></CardContent></Card>
      </>
    );
  } else if (view === "wages") {
    const report = await wagesReport(month, year, { projectId });
    const cols: Column<(typeof report.rows)[number]>[] = [
      { key: "empCode", header: "Code", render: (r) => r.empCode },
      { key: "name", header: "Employee", render: (r) => r.name },
      { key: "days", header: "Days", className: "text-right", render: (r) => r.totalDays },
      { key: "present", header: "Present", className: "text-right", render: (r) => r.present },
      { key: "hours", header: "Hours", className: "text-right", render: (r) => formatNumber(r.totalHours) },
      { key: "basic", header: "Basic", className: "text-right", render: (r) => formatMoney(r.basicWage) },
      { key: "allow", header: "Allowances", className: "text-right", render: (r) => formatMoney(r.allowances) },
      { key: "gross", header: "Gross", className: "text-right", render: (r) => <span className="font-medium">{formatMoney(r.gross)}</span> },
    ];
    content = (
      <>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Employees (worked)</p><p className="mt-1 text-2xl font-bold">{report.rows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Gross</p><p className="mt-1 text-2xl font-bold">{formatMoney(report.totalGross)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Daily Wage (workers/days)</p><p className="mt-1 text-2xl font-bold">{formatNumber(report.dailyWagesCount)} / {formatMoney(report.dailyTotal)}</p></CardContent></Card>
        <Card className="lg:col-span-3"><CardHeader><CardTitle className="text-base">Wages — {monthNames[month - 1]} {year}</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={cols} rows={report.rows} rowKey={(r) => r.empCode} emptyMessage="No wage records this month." /></CardContent></Card>
      </>
    );
  } else {
    const report = await salaryReport(month, year, { projectId });
    const cols: Column<(typeof report.rows)[number]>[] = [
      { key: "empCode", header: "Code", render: (r) => <span className="font-mono text-xs">{r.empCode}</span> },
      { key: "name", header: "Employee", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "project", header: "Project", render: (r) => r.project },
      { key: "present", header: "Pr", className: "text-right", render: (r) => r.present },
      { key: "absent", header: "Ab", className: "text-right", render: (r) => r.absent },
      { key: "gross", header: "Gross", className: "text-right", render: (r) => formatMoney(r.gross) },
      { key: "ded", header: "Deduct", className: "text-right", render: (r) => formatMoney((r as { deduction?: number }).deduction ?? 0) },
      { key: "wht", header: "WHT", className: "text-right", render: (r) => formatMoney(r.wht) },
      { key: "adv", header: "Adv", className: "text-right", render: (r) => formatMoney(r.advances) },
      { key: "net", header: "Net Pay", className: "text-right", render: (r) => <span className="font-semibold">{formatMoney(r.net)}</span> },
    ];
    content = (
      <>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Employees</p><p className="mt-1 text-2xl font-bold">{report.rows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Gross</p><p className="mt-1 text-2xl font-bold">{formatMoney(report.totalGross)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Net</p><p className="mt-1 text-2xl font-bold">{formatMoney(report.totalNet)}</p></CardContent></Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Payroll — {monthNames[month - 1]} {year} ({report.daysInMonth} days)</CardTitle>
            <Link href={`/api/hr/reports/salary/export?month=${month}&year=${year}${projectId ? `&projectId=${projectId}` : ""}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={cols} rows={report.rows} rowKey={(r) => r.empCode} emptyMessage="No payroll data this month." />
            <div className="flex justify-end gap-6 border-t bg-muted/40 px-3 py-2 text-sm">
              <span>Gross <span className="font-medium">{formatMoney(report.totalGross)}</span></span>
              <span>WHT <span className="font-medium">{formatMoney(report.totalWht)}</span></span>
              <span>Advances <span className="font-medium">{formatMoney(report.totalAdvances)}</span></span>
              <span>Net <span className="font-semibold">{formatMoney(report.totalNet)}</span></span>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="HR Reports" description="Attendance, leaves, wages and monthly payroll with Excel export." />

      <div className="flex flex-wrap gap-2">{VIEWS.map((v) => tab(v, v[0].toUpperCase() + v.slice(1)))}</div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/hr/reports?view=${view}&month=${prevMonth.month}&year=${prevMonth.year}`} className="rounded border px-2 py-1 text-sm hover:bg-accent"><ChevronLeft className="h-4 w-4" /></Link>
          <span className="text-sm font-medium">{monthNames[month - 1]} {year}</span>
          <Link href={`/hr/reports?view=${view}&month=${nextMonth.month}&year=${nextMonth.year}`} className="rounded border px-2 py-1 text-sm hover:bg-accent"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        {projects.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Project:</span>
            <Link href={base.replace(`&projectId=${projectId ?? ""}`, "")} className={`rounded-full border px-3 py-1 text-xs ${!projectId ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>All</Link>
            {projects.map((p) => (
              <Link key={p.id} href={`${base}${p.id === projectId ? "" : `&projectId=${p.id}`}`} className={`rounded-full border px-3 py-1 text-xs ${projectId === p.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                {p.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">{content}</div>
    </div>
  );
}
