import Link from "next/link";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCostDashboard, listCostLogs, listVariationOrders, listIpcs, listCostCenters } from "@/server/cost/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { CostLogForm } from "@/components/cost/cost-log-form";
import { CostCenterForm } from "@/components/cost/cost-center-form";
import { VariationForm } from "@/components/cost/variation-form";
import { IpcForm } from "@/components/cost/ipc-form";
import { formatMoney, formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function CostPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.COST_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const pid = projectId ? Number(projectId) : projects[0]?.id;

  const [dashboard, costLogs, variations, ipcs, costCenters, boqItemsAll] = pid
    ? await Promise.all([
        getCostDashboard(pid),
        listCostLogs(pid),
        listVariationOrders(pid),
        listIpcs(pid),
        listCostCenters(pid),
        prisma.bOQItem.findMany({ select: { id: true, itemCode: true, description: true }, take: 300 }),
      ])
    : [null, [], [], [], [], []];

  if (pid) await requireProjectAccess(user, pid, "VIEWER");

  const totalActual = costLogs.reduce((s, l) => s + l.amount.toNumber(), 0);
  const cards = [
    { label: "Budget", value: formatMoney(dashboard?.budgetTotal ?? 0), tone: "" },
    { label: "Actual Cost", value: formatMoney(dashboard?.actualCost ?? totalActual), tone: "" },
    {
      label: "Variance",
      value: formatMoney(dashboard?.variance ?? 0),
      tone: (dashboard?.variance ?? 0) < 0 ? "text-destructive" : "text-emerald-600",
    },
    { label: "Open Alerts", value: String(dashboard?.openAlerts ?? 0), tone: (dashboard?.openAlerts ?? 0) > 0 ? "text-destructive" : "" },
    { label: "Variations", value: formatMoney(dashboard?.variationTotal ?? 0), tone: "" },
    { label: "Certified IPC", value: formatMoney(dashboard?.certifiedIpc ?? 0), tone: "text-emerald-600" },
  ];

  const logColumns: Column<(typeof costLogs)[number]>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "costType", header: "Type", render: (r) => <Badge variant="secondary">{r.costType}</Badge> },
    { key: "description", header: "Description" },
    { key: "costCenter", header: "Center", render: (r) => (r.costCenter ? `${r.costCenter.code}` : "—") },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
  ];

  const voColumns: Column<(typeof variations)[number]>[] = [
    { key: "voNo", header: "VO No", render: (r) => <span className="font-mono text-xs">{r.voNo}</span> },
    { key: "title", header: "Title" },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (r.status === "DRAFT" || r.status === "PENDING" ? <SubmitToApprovalButton apiPath={`/api/cost/variations/${r.id}/submit`} /> : null),
    },
  ];

  const ipcColumns: Column<(typeof ipcs)[number]>[] = [
    {
      key: "ipcNo",
      header: "IPC No",
      render: (r) => (
        <Link href={`/cost/ipcs/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
          {r.ipcNo}
        </Link>
      ),
    },
    { key: "period", header: "Period", render: (r) => r.period ?? "—" },
    { key: "lines", header: "Lines", className: "text-right", render: (r) => r._count.lines },
    { key: "grossValue", header: "Gross", className: "text-right", render: (r) => formatMoney(r.grossValue) },
    { key: "netValue", header: "Net", className: "text-right", render: (r) => <span className="font-medium">{formatMoney(r.netValue)}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (r.status === "DRAFT" || r.status === "PENDING" ? <SubmitToApprovalButton apiPath={`/api/cost/ipcs/${r.id}/submit`} /> : null),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cost Control" description="Cost ledger, budget vs actual, variation orders and interim payment certificates." />

      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const active = p.id === pid;
          return (
            <Link
              key={p.id}
              href={`/cost?projectId=${p.id}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p.code}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-lg font-bold ${c.tone}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={logColumns} rows={costLogs} rowKey={(r) => r.id} emptyMessage="No cost entries yet — log your first cost." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variation Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={voColumns} rows={variations} rowKey={(r) => r.id} emptyMessage="No variation orders yet." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interim Payment Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={ipcColumns} rows={ipcs} rowKey={(r) => r.id} emptyMessage="No IPCs yet." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CostLogForm projectId={pid ?? 0} costCenters={costCenters} />
          <CostCenterForm projectId={pid ?? 0} />
          <VariationForm projectId={pid ?? 0} />
          <IpcForm projectId={pid ?? 0} boqItems={boqItemsAll} />
        </div>
      </div>
    </div>
  );
}
