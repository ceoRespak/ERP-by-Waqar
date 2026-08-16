import Link from "next/link";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listNcrs, listRisks, listTraining, listAspects, listIncidents } from "@/server/iso/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { NcrForm } from "@/components/iso/ncr-form";
import { RiskForm } from "@/components/iso/risk-form";
import { TrainingForm } from "@/components/iso/training-form";
import { AspectForm } from "@/components/iso/aspect-form";
import { IncidentForm } from "@/components/iso/incident-form";
import { formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function IsoPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.ISO_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const pid = projectId ? Number(projectId) : null;

  const [ncrs, risks, training, aspects, incidents, activities, employees] = await Promise.all([
    listNcrs(pid ?? undefined),
    listRisks(pid ?? undefined),
    listTraining(),
    listAspects(pid ?? undefined),
    listIncidents(pid ?? undefined),
    prisma.activity.findMany({ select: { id: true, wbsCode: true, name: true }, orderBy: { wbsCode: "asc" } }),
    prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  const openNcrs = ncrs.filter((n) => n.status !== "CLOSED").length;
  const highRisks = risks.filter((r) => r.riskRating >= 15).length;
  const trainingExpiring = training.filter((t) => t.expiryDate && t.expiryDate > new Date() && t.expiryDate < new Date(Date.now() + 60 * 86400000)).length;
  const openIncidents = incidents.filter((i) => i.investigationStatus !== "CLOSED").length;

  const ncrColumns: Column<(typeof ncrs)[number]>[] = [
    {
      key: "ncrNo",
      header: "NCR No",
      render: (r) => (
        <Link href={`/iso/ncrs/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
          {r.ncrNo}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "source", header: "Source", render: (r) => <Badge variant="secondary">{r.source}</Badge> },
    { key: "description", header: "Description", render: (r) => <span className="line-clamp-1 max-w-[260px]">{r.description}</span> },
    {
      key: "severity",
      header: "Severity",
      render: (r) => <Badge variant={r.severity === "CRITICAL" ? "destructive" : r.severity === "MAJOR" ? "default" : "secondary"}>{r.severity}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (r.status === "OPEN" ? <SubmitToApprovalButton apiPath={`/api/iso/ncrs/${r.id}/submit`} label="Review" /> : null),
    },
  ];

  const riskColumns: Column<(typeof risks)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "hazard", header: "Hazard", render: (r) => <span className="font-medium">{r.hazard}</span> },
    { key: "activity", header: "Activity", render: (r) => (r.activity ? `${r.activity.wbsCode}` : "—") },
    {
      key: "riskRating",
      header: "Rating",
      render: (r) => {
        const v = r.riskRating;
        return <Badge variant={v >= 15 ? "destructive" : v >= 8 ? "default" : "secondary"}>{v}</Badge>;
      },
    },
    { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
  ];

  const trainingColumns: Column<(typeof training)[number]>[] = [
    { key: "employee", header: "Employee", render: (r) => (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "—") },
    { key: "trainingTitle", header: "Training" },
    { key: "provider", header: "Provider", render: (r) => r.provider ?? "—" },
    { key: "trainingDate", header: "Date", render: (r) => (r.trainingDate ? formatDate(r.trainingDate) : "—") },
    {
      key: "expiryDate",
      header: "Cert Expiry",
      render: (r) => {
        if (!r.expiryDate) return "—";
        const soon = r.expiryDate < new Date(Date.now() + 60 * 86400000);
        return <span className={soon ? "font-medium text-destructive" : ""}>{formatDate(r.expiryDate)}{soon ? " ⚠" : ""}</span>;
      },
    },
    { key: "competencyLevel", header: "Level", render: (r) => <Badge variant="secondary">{r.competencyLevel}</Badge> },
  ];

  const aspectColumns: Column<(typeof aspects)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "activity", header: "Activity", render: (r) => <span className="font-medium">{r.activity}</span> },
    { key: "aspect", header: "Aspect", render: (r) => r.aspect },
    { key: "impact", header: "Impact", render: (r) => r.impact },
    {
      key: "significance",
      header: "Significance",
      render: (r) => <Badge variant={r.significance === "HIGH" ? "destructive" : r.significance === "MEDIUM" ? "default" : "secondary"}>{r.significance}</Badge>,
    },
  ];

  const incidentColumns: Column<(typeof incidents)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "incidentType", header: "Type", render: (r) => <Badge variant="secondary">{r.incidentType.replace("_", " ")}</Badge> },
    { key: "description", header: "Description", render: (r) => <span className="line-clamp-1 max-w-[260px]">{r.description}</span> },
    { key: "severity", header: "Severity", render: (r) => <Badge variant={r.severity === "SEVERE" || r.severity === "MAJOR" ? "destructive" : "secondary"}>{r.severity}</Badge> },
    {
      key: "investigationStatus",
      header: "Investigation",
      render: (r) => <Badge variant={statusVariant(r.investigationStatus)}>{r.investigationStatus.replace("_", " ")}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.investigationStatus === "OPEN" ? <SubmitToApprovalButton apiPath={`/api/iso/incidents/${r.id}/submit`} label="Investigate" /> : null,
    },
  ];

  const projectPills = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/iso"
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${!pid ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        All Projects
      </Link>
      {projects.map((p) => {
        const active = p.id === pid;
        return (
          <Link
            key={p.id}
            href={`/iso?projectId=${p.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {p.code}
          </Link>
        );
      })}
    </div>
  );

  const cards = [
    { label: "Open NCRs", value: openNcrs, tone: openNcrs > 0 ? "text-destructive" : "" },
    { label: "High Risks (≥15)", value: highRisks, tone: highRisks > 0 ? "text-destructive" : "" },
    { label: "Certificates Expiring", value: trainingExpiring, tone: trainingExpiring > 0 ? "text-amber-600" : "" },
    { label: "Open Incidents", value: openIncidents, tone: openIncidents > 0 ? "text-destructive" : "" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ISO Compliance" description="ISO 9001 / 14001 / 45001 — NCR & CAPA, risk assessments, training, environment, safety incidents." />

      {projectPills}

      <div className="grid gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${c.tone}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Non-Conformance Reports</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={ncrColumns} rows={ncrs} rowKey={(r) => r.id} emptyMessage="No NCRs yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Risk Assessments</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={riskColumns} rows={risks} rowKey={(r) => r.id} emptyMessage="No risk assessments yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Training Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={trainingColumns} rows={training} rowKey={(r) => r.id} emptyMessage="No training records yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Environmental Aspects</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={aspectColumns} rows={aspects} rowKey={(r) => r.id} emptyMessage="No environmental aspects yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Safety Incidents</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={incidentColumns} rows={incidents} rowKey={(r) => r.id} emptyMessage="No incidents reported." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <NcrForm projectId={pid} projects={projects} />
          <RiskForm projectId={pid} projects={projects} activities={activities} />
          <TrainingForm employees={employees} />
          <AspectForm projectId={pid} projects={projects} />
          <IncidentForm projectId={pid} projects={projects} employees={employees} />
        </div>
      </div>
    </div>
  );
}
