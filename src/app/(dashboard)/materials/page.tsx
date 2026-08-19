import Link from "next/link";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listMaterialRequests, listMaterialIssues } from "@/server/materials/service";
import { listWarehouses } from "@/server/inventory/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { MaterialRequestForm } from "@/components/materials/request-form";
import { MaterialIssueForm } from "@/components/materials/issue-form";
import { formatDate } from "@/lib/utils";
import { parsePage, buildBaseHref } from "@/lib/pagination";

type Props = { searchParams: Promise<{ projectId?: string; page?: string }> };

export default async function MaterialsPage({ searchParams }: Props) {
  const { projectId, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.MATERIALS_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const pid = projectId ? Number(projectId) : projects[0]?.id;

  const [requests, issues, activities, items, warehouses] = pid
    ? await Promise.all([
        listMaterialRequests({ projectId: pid }),
        listMaterialIssues({ projectId: pid }),
        prisma.activity.findMany({ where: { projectId: pid }, select: { id: true, wbsCode: true, name: true }, orderBy: { wbsCode: "asc" } }),
        prisma.item.findMany({ select: { id: true, code: true, name: true, unit: true }, orderBy: { code: "asc" }, take: 500 }),
        listWarehouses(),
      ])
    : [[], [], [], [], []];

  if (pid) await requireProjectAccess(user, pid, "VIEWER");

  // Plain shapes for client forms (Decimals -> numbers not needed here, but
  // avoid passing raw rows with Decimal item quantities into client components).
  const requestSummaries = requests.map((r) => ({ id: r.id, mrNo: r.mrNo, status: r.status }));

  const openRequests = requests.filter((r) => r.status === "DRAFT" || r.status === "PENDING" || r.status === "APPROVED").length;
  const issuedCount = issues.length;

  const reqColumns: Column<(typeof requests)[number]>[] = [
    {
      key: "mrNo",
      header: "MR No",
      render: (r) => (
        <Link href={`/materials/requests/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
          {r.mrNo}
        </Link>
      ),
    },
    { key: "activity", header: "Activity", render: (r) => (r.activity ? `${r.activity.wbsCode} ${r.activity.name}` : "—") },
    { key: "lines", header: "Lines", className: "text-right", render: (r) => r._count.items },
    {
      key: "requiredDate",
      header: "Required",
      render: (r) => (r.requiredDate ? formatDate(r.requiredDate) : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "DRAFT" || r.status === "REJECTED" ? <SubmitToApprovalButton apiPath={`/api/materials/requests/${r.id}/submit`} /> : null,
    },
  ];

  const issueColumns: Column<(typeof issues)[number]>[] = [
    { key: "issueNo", header: "Issue No", render: (r) => <span className="font-mono text-xs">{r.issueNo}</span> },
    { key: "request", header: "Request", render: (r) => (r.request ? r.request.mrNo : "—") },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse?.code ?? "—" },
    { key: "items", header: "Items", className: "text-right", render: (r) => r._count.items },
    { key: "issueDate", header: "Date", render: (r) => formatDate(r.issueDate) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" description="Material requests from site to store, approvals, and store-to-project issues." />

      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const active = p.id === pid;
          return (
            <Link
              key={p.id}
              href={`/materials?projectId=${p.id}`}
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
            <p className="text-sm text-muted-foreground">Open Requests</p>
            <p className="mt-1 text-2xl font-bold">{openRequests}</p>
            <p className="text-xs text-muted-foreground">{requests.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Issues Logged</p>
            <p className="mt-1 text-2xl font-bold">{issuedCount}</p>
            <p className="text-xs text-muted-foreground">store → project</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved Requests Ready to Issue</p>
            <p className="mt-1 text-2xl font-bold">{requests.filter((r) => r.status === "APPROVED").length}</p>
            <p className="text-xs text-muted-foreground">awaiting dispatch</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={reqColumns} rows={requests} rowKey={(r) => r.id} emptyMessage="No material requests yet." page={page} pageSize={25} baseHref={buildBaseHref("/materials", { projectId })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Issues</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={issueColumns} rows={issues} rowKey={(r) => r.id} emptyMessage="No issues yet." page={page} pageSize={25} baseHref={buildBaseHref("/materials", { projectId })} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <MaterialRequestForm projectId={pid ?? 0} activities={activities} items={items} />
          <MaterialIssueForm projectId={pid ?? 0} requests={requestSummaries} warehouses={warehouses} items={items} />
        </div>
      </div>
    </div>
  );
}
