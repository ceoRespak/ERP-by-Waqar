import Link from "next/link";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listActivities, listProjectProgress, listLaborLogs, listEquipments, listEquipmentUsage,
} from "@/server/progress/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SCurveChart } from "@/components/progress/scurve-chart";
import { ActivityForm } from "@/components/progress/activity-form";
import { ProgressForm } from "@/components/progress/progress-form";
import { LaborForm } from "@/components/progress/labor-form";
import { EquipmentForm, EquipmentUsageForm } from "@/components/progress/equipment-forms";
import { formatDate, formatNumber } from "@/lib/utils";

type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function ProgressPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.PROGRESS_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  const pid = projectId ? Number(projectId) : projects[0]?.id;
  if (!pid) {
    return (
      <div>
        <PageHeader title="Progress" description="Activity-based progress tracking, S-curve, labor and equipment." />
        <Card><CardContent className="p-10 text-center text-muted-foreground">No projects yet — create a project first.</CardContent></Card>
      </div>
    );
  }
  await requireProjectAccess(user, pid, "VIEWER");

  const [activities, curvePoints, laborLogs, equipments, usageLogs] = await Promise.all([
    listActivities(pid),
    listProjectProgress(pid),
    listLaborLogs(pid),
    listEquipments(pid),
    listEquipmentUsage(pid),
  ]);

  const selectedProject = projects.find((p) => p.id === pid);

  // Plain shape for client forms (Decimals -> numbers)
  const formActivities = activities.map((a) => ({
    id: a.id,
    wbsCode: a.wbsCode,
    name: a.name,
    totalQty: a.totalQty.toNumber(),
  }));

  // Build tree: children map
  const childrenOf = (parentId: number | null) => activities.filter((a) => (a.parentId ?? null) === parentId);
  const roots = childrenOf(null);

  const laborColumns: Column<(typeof laborLogs)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "laborType", header: "Type", render: (r) => <Badge variant="secondary">{r.laborType}</Badge> },
    { key: "count", header: "Count", className: "text-right", render: (r) => r.count },
    { key: "activity", header: "Activity", render: (r) => (r.activity ? `${r.activity.wbsCode} ${r.activity.name}` : "—") },
  ];
  const usageColumns: Column<(typeof usageLogs)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "equipment", header: "Equipment", render: (r) => r.equipment.name },
    { key: "hours", header: "Hours", className: "text-right", render: (r) => formatNumber(r.hours) },
    { key: "notes", header: "Notes", render: (r) => r.notes ?? "—" },
  ];

  function renderActivityRow(activity: (typeof activities)[number], depth: number): React.ReactNode {
    const last = activity.progress[0];
    const percent = last?.percent.toNumber() ?? 0;
    return (
      <div key={activity.id}>
        <div className="grid gap-2 border-b px-3 py-2 hover:bg-muted/40 sm:grid-cols-12" style={{ paddingLeft: `${depth * 22 + 12}px` }}>
          <div className="sm:col-span-2"><span className="font-mono text-xs font-medium">{activity.wbsCode}</span></div>
          <div className="sm:col-span-5"><p className="text-sm font-medium">{activity.name}</p></div>
          <div className="text-sm text-muted-foreground sm:col-span-1">{activity.unit}</div>
          <div className="text-right text-sm sm:col-span-2">{formatNumber(activity.totalQty)}</div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-end gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, percent)}%` }} />
              </div>
              <span className="text-sm font-medium">{percent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        {childrenOf(activity.id).map((child) => renderActivityRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Activity-based progress, planned vs actual, S-curve, labor and equipment." />

      {/* Project selector */}
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const active = p.id === pid;
          return (
            <Link
              key={p.id}
              href={`/progress?projectId=${p.id}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p.code}
            </Link>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold">{selectedProject?.name}</h2>

      {/* S-curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">S-Curve — Planned vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <SCurveChart
            points={curvePoints.map((p) => ({
              reportDate: p.reportDate,
              plannedPercent: p.plannedPercent.toNumber(),
              actualPercent: p.actualPercent.toNumber(),
            }))}
          />
        </CardContent>
      </Card>

      {/* Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-12">
                <div className="sm:col-span-2">WBS</div>
                <div className="sm:col-span-5">Activity</div>
                <div className="sm:col-span-1">Unit</div>
                <div className="text-right sm:col-span-2">Total Qty</div>
                <div className="text-right sm:col-span-2">Progress</div>
              </div>
              {roots.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">No activities yet — add one.</p>
              )}
              {roots.map((r) => renderActivityRow(r, 0))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <ActivityForm projectId={pid} activities={formActivities} />
          <ProgressForm projectId={pid} activities={formActivities} />
        </div>
      </div>

      {/* Labor & Equipment */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Labor Deployment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LaborForm projectId={pid} activities={formActivities} />
            <div className="p-0">
              <DataTable columns={laborColumns} rows={laborLogs} rowKey={(r) => r.id} emptyMessage="No labor logs yet." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <EquipmentForm projectId={pid} />
              <EquipmentUsageForm projectId={pid} equipments={equipments} />
            </div>
            <div className="p-0">
              <DataTable columns={usageColumns} rows={usageLogs} rowKey={(r) => r.id} emptyMessage="No equipment usage logged yet." />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
