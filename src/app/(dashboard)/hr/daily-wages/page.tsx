import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDailyWages, listDailyWageWorkers, dailyWageMonthlyReport } from "@/server/hr/attendance";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DailyWageForm } from "@/components/hr/daily-wage-form";
import { WorkerForm } from "@/components/hr/worker-form";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";

const VIEWS = ["records", "monthly", "workers"] as const;
type View = (typeof VIEWS)[number];

export default async function DailyWagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; year?: string }>;
}) {
  await requirePermission(PERMISSIONS.HR_READ);
  const params = await searchParams;
  const view: View = (VIEWS as readonly string[]).includes(params.view ?? "") ? (params.view as View) : "records";
  const month = Number(params.month) || new Date().getMonth() + 1;
  const year = Number(params.year) || new Date().getFullYear();
  const [projects] = await Promise.all([prisma.hrProject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })]);

  const tab = (v: View, label: string) => {
    const href = `/hr/daily-wages?view=${v}&month=${month}&year=${year}`;
    return (
      <Link key={v} href={href} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${view === v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
        {label}
      </Link>
    );
  };

  let main: React.ReactNode = null;
  let side: React.ReactNode = <DailyWageForm projects={projects} />;

  if (view === "records") {
    const records = await listDailyWages({ month, year });
    const cols: Column<(typeof records)[number]>[] = [
      { key: "date", header: "Date", render: (r) => formatDate(r.date) },
      { key: "cnic", header: "CNIC", render: (r) => <span className="font-mono text-xs">{r.cnic}</span> },
      { key: "name", header: "Name", render: (r) => r.name },
      { key: "project", header: "Project", render: (r) => r.project.name },
      { key: "in", header: "In", render: (r) => (r.checkInTime ? formatDate(r.checkInTime).split(",")[1]?.trim() ?? "—" : "—") },
      { key: "out", header: "Out", render: (r) => (r.checkOutTime ? formatDate(r.checkOutTime).split(",")[1]?.trim() ?? "—" : "—") },
      { key: "hours", header: "Hours", className: "text-right", render: (r) => formatNumber(r.totalHours) },
      { key: "amount", header: "Wage", className: "text-right", render: (r) => formatMoney(r.dailyWageAmount) },
      { key: "approval", header: "Approval", render: (r) => <Badge variant={statusVariant(r.approvalStatus)}>{r.approvalStatus}</Badge> },
    ];
    main = (
      <Card>
        <CardHeader><CardTitle className="text-base">Daily Wage Records — {month}/{year}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable columns={cols} rows={records} rowKey={(r) => r.id} emptyMessage="No daily wage records this month." />
        </CardContent>
      </Card>
    );
  } else if (view === "monthly") {
    const report = await dailyWageMonthlyReport(month, year);
    const cols: Column<(typeof report.workers)[number]>[] = [
      { key: "cnic", header: "CNIC", render: (r) => <span className="font-mono text-xs">{r.cnic}</span> },
      { key: "name", header: "Name", render: (r) => r.name },
      { key: "days", header: "Days", className: "text-right", render: (r) => r.totalDays },
      { key: "wages", header: "Total Wages", className: "text-right", render: (r) => <span className="font-medium">{formatMoney(r.totalWages)}</span> },
    ];
    main = (
      <>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Workers</p><p className="mt-1 text-2xl font-bold">{report.workers.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Wages</p><p className="mt-1 text-2xl font-bold">{formatMoney(report.totalWages)}</p></CardContent></Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Monthly Summary — {month}/{year}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable columns={cols} rows={report.workers} rowKey={(r) => r.cnic} emptyMessage="No wage data this month." />
          </CardContent>
        </Card>
      </>
    );
  } else {
    const workers = await listDailyWageWorkers();
    const cols: Column<(typeof workers)[number]>[] = [
      { key: "cnic", header: "CNIC", render: (r) => <span className="font-mono text-xs">{r.cnic}</span> },
      { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "fatherName", header: "Father", render: (r) => r.fatherName ?? "—" },
      { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
      { key: "project", header: "Project", render: (r) => r.project.name },
      { key: "dailyWageAmount", header: "Daily Wage", className: "text-right", render: (r) => formatMoney(r.dailyWageAmount) },
      { key: "isActive", header: "Status", render: (r) => (r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>) },
    ];
    main = (
      <Card>
        <CardHeader><CardTitle className="text-base">Worker Registry</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable columns={cols} rows={workers} rowKey={(r) => r.id} emptyMessage="No workers registered yet." />
        </CardContent>
      </Card>
    );
    side = <WorkerForm projects={projects} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Wages" description="Daily-wage workers, attendance records and monthly wage summaries." />
      <div className="flex flex-wrap gap-2">{VIEWS.map((v) => tab(v, v[0].toUpperCase() + v.slice(1)))}</div>
      <div className={`grid gap-6 ${view === "monthly" ? "" : "lg:grid-cols-3"}`}>
        <div className={view === "monthly" ? "grid gap-4 sm:grid-cols-2 lg:col-span-3" : "lg:col-span-2"}>{main}</div>
        {view !== "monthly" && <div>{side}</div>}
      </div>
    </div>
  );
}
