import Link from "next/link";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listBudgets, listCostAlerts } from "@/server/budget/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { BudgetForm } from "@/components/budget/budget-form";
import { formatMoney, formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function BudgetPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.BUDGET_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const pid = projectId ? Number(projectId) : projects[0]?.id;

  const [budgets, alerts, activities] = pid
    ? await Promise.all([
        listBudgets(pid),
        listCostAlerts(pid),
        prisma.activity.findMany({ where: { projectId: pid }, select: { id: true, wbsCode: true, name: true }, orderBy: { wbsCode: "asc" } }),
      ])
    : [[], [], []];

  if (pid) await requireProjectAccess(user, pid, "VIEWER");

  const totalBudget = budgets.reduce((s, b) => s + b.totalAmount.toNumber(), 0);
  const totalLines = budgets.reduce((s, b) => s + b.lines.length, 0);
  const openAlerts = alerts.filter((a) => !a.resolved).length;

  const lineColumns: Column<(typeof budgets)[number]["lines"][number]>[] = [
    { key: "costType", header: "Type", render: (r) => <Badge variant="secondary">{r.costType}</Badge> },
    { key: "activity", header: "Activity", render: (r) => (r.activityId ? "—" : "—") },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Budgeting" description="Project budgets by activity & cost type, with automatic cost-overrun alerts." />

      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const active = p.id === pid;
          return (
            <Link
              key={p.id}
              href={`/budget?projectId=${p.id}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p.code}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(totalBudget)}</p>
            <p className="text-xs text-muted-foreground">{budgets.length} budget(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Budget Lines</p>
            <p className="mt-1 text-2xl font-bold">{totalLines}</p>
            <p className="text-xs text-muted-foreground">across all versions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Cost Alerts</p>
            <p className={`mt-1 text-2xl font-bold ${openAlerts > 0 ? "text-destructive" : ""}`}>{openAlerts}</p>
            <p className="text-xs text-muted-foreground">{alerts.length} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {budgets.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">No budgets yet — create one.</CardContent>
            </Card>
          )}
          {budgets.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{b.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {b.period ?? "No period"} · {b.lines.length} lines · created {formatDate(b.createdAt)}
                  </p>
                </div>
                <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b bg-muted/50 px-3 py-2 text-sm font-semibold">Total: {formatMoney(b.totalAmount)}</div>
                <DataTable
                  columns={lineColumns}
                  rows={b.lines}
                  rowKey={(r) => r.id}
                  emptyMessage="No lines yet."
                />
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No alerts — budgets are on track.</p>}
              {alerts.map((a) => (
                <div key={a.id} className={`rounded-md border p-3 text-sm ${a.resolved ? "opacity-60" : "border-destructive/40 bg-destructive/5"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{a.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(a.triggeredAt)} · {a.project.code}
                      </p>
                    </div>
                    <Badge variant={a.resolved ? "secondary" : "destructive"}>{a.resolved ? "Resolved" : "Open"}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <BudgetForm projectId={pid ?? 0} activities={activities} />
        </div>
      </div>
    </div>
  );
}
