import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { userHasPermission } from "@/lib/access";
import { PERMISSIONS } from "@/lib/constants";
import { getProjectDetail } from "@/server/projects/service";
import { listProjectAttachments } from "@/server/projects/attachments";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCategoryBadge, ProjectStatusBadge } from "@/components/projects/project-meta";
import { ProjectTeam } from "@/components/projects/project-team";
import { ProjectAttachments } from "@/components/projects/project-attachments";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate, formatMoney } from "@/lib/utils";
import {
  MapPin, User, Landmark, CircleDollarSign, TrendingUp, TrendingDown,
  ClipboardList, ListTree, PackageSearch, FileText, AlertTriangle, ShieldAlert, HelpCircle,
} from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDashboardPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return notFound();

  await requirePermission(PERMISSIONS.PROJECTS_READ);
  await requireProjectAccess(user, Number(id), "VIEWER");

  const detail = await getProjectDetail(Number(id));
  if (!detail) notFound();
  const { project, kpis } = detail;

  const [attachments, canManageProject, canManagePermanent] = await Promise.all([
    listProjectAttachments(project.id),
    userHasPermission(user, PERMISSIONS.DOCUMENTS_CREATE, project.id),
    userHasPermission(user, PERMISSIONS.DOCUMENTS_CREATE, null),
  ]);

  const kpiCards = [
    {
      label: "Budget",
      value: formatMoney(kpis.budget),
      icon: Landmark,
      color: "text-sky-600",
      note: kpis.budget ? "approved budget total" : "no budget yet",
    },
    {
      label: "Actual Cost",
      value: formatMoney(kpis.actualCost),
      icon: CircleDollarSign,
      color: "text-amber-600",
      note: "from cost logs",
    },
    {
      label: "Variance",
      value: formatMoney(kpis.variance),
      icon: kpis.variance >= 0 ? TrendingUp : TrendingDown,
      color: kpis.variance >= 0 ? "text-emerald-600" : "text-destructive",
      note: kpis.variance >= 0 ? "under budget" : "over budget",
    },
    {
      label: "Progress",
      value: `${kpis.progressPercent}%`,
      icon: ClipboardList,
      color: "text-indigo-600",
      note: `planned ${kpis.plannedPercent}%`,
    },
  ];

  const counts = [
    { label: "BOQs", value: project._count.boqs, href: "/boq", icon: ListTree },
    { label: "Activities", value: project._count.activities, href: "/progress", icon: ClipboardList },
    { label: "Material Requests", value: project._count.materialRequests, href: "/procurement/requisitions", icon: PackageSearch },
    { label: "DPRs", value: project._count.dprs, href: "/sites/dpr", icon: FileText },
    { label: "Documents", value: project._count.documents, href: "/documents", icon: FileText },
    { label: "Open NCRs", value: kpis.openNcr, href: "/iso", icon: ShieldAlert },
    { label: "Open Incidents", value: kpis.openIncidents, href: "/iso", icon: AlertTriangle },
    { label: "Open Alerts", value: kpis.openCostAlerts, href: "/budget", icon: HelpCircle },
  ];

  const costColumns: Column<(typeof detail.recentCostLogs)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "costType", header: "Type", render: (r) => <Badge variant="secondary">{r.costType}</Badge> },
    { key: "description", header: "Description" },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
  ];

  const dprColumns: Column<(typeof detail.recentDprs)[number]>[] = [
    { key: "dprNo", header: "DPR", render: (r) => <span className="font-medium">{r.dprNo}</span> },
    { key: "reportDate", header: "Date", render: (r) => formatDate(r.reportDate) },
    { key: "weather", header: "Weather", render: (r) => r.weather ?? "—" },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <ProjectCategoryBadge category={project.category} />
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{project.code}</span>
            {project.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>
            )}
            {project.client && <span>{project.client.name}</span>}
            {project.manager && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {project.manager.firstName} {project.manager.lastName}
              </span>
            )}
          </p>
          {project.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
          {(project.assetAccount || project.incomeAccount) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {project.assetAccount && (
                <span className="inline-flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5" /> Asset: {project.assetAccount.name}
                </span>
              )}
              {project.incomeAccount && (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Income: {project.incomeAccount.name}
                </span>
              )}
            </div>
          )}
        </div>
        <Link href="/projects" className="text-sm text-primary hover:underline">← All projects</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Counts / quick links */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {counts.map((c) => (
            <Link key={c.label} href={c.href} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
              <c.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold leading-tight">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent cost logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={costColumns} rows={detail.recentCostLogs} rowKey={(r) => r.id} emptyMessage="No cost entries yet." />
          </CardContent>
        </Card>

        {/* Recent DPRs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Daily Progress Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={dprColumns} rows={detail.recentDprs} rowKey={(r) => r.id} emptyMessage="No DPRs yet." />
          </CardContent>
        </Card>
      </div>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Team & Access</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectTeam
            projectId={project.id}
            members={project.projectUsers}
            users={await prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } })}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <ProjectAttachments
        projectId={project.id}
        canManage={canManageProject}
        canManagePermanent={canManagePermanent}
        attachments={attachments}
      />
    </div>
  );
}
