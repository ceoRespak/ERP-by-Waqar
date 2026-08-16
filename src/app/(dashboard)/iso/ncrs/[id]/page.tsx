import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getNcrDetail } from "@/server/iso/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { ActionForm } from "@/components/iso/action-form";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function NcrDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.ISO_READ);
  const ncr = await getNcrDetail(Number(id));
  if (!ncr) notFound();

  const employees = await prisma.employee.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }],
  });

  const actions = ncr.correctiveActions;
  const columns: Column<(typeof actions)[number]>[] = [
    { key: "type", header: "Type", render: (r) => <Badge variant={r.type === "PREVENTIVE" ? "secondary" : "default"}>{r.type}</Badge> },
    { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "action", header: "Action", render: (r) => <span className="line-clamp-1 max-w-[240px]">{r.action}</span> },
    { key: "rootCause", header: "Root Cause", render: (r) => r.rootCause ?? "—" },
    { key: "targetDate", header: "Target", render: (r) => (r.targetDate ? formatDate(r.targetDate) : "—") },
    { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={ncr.ncrNo}
          description={ncr.project ? `${ncr.project.code} · ${ncr.project.name}` : "Company-wide"}
        />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(ncr.status)}>{ncr.status.replace("_", " ")}</Badge>
          <Badge variant={ncr.severity === "CRITICAL" ? "destructive" : ncr.severity === "MAJOR" ? "default" : "secondary"}>{ncr.severity}</Badge>
          {ncr.status === "OPEN" ? <SubmitToApprovalButton apiPath={`/api/iso/ncrs/${ncr.id}/submit`} label="Start Review" /> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corrective / Preventive Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} rows={actions} rowKey={(r) => r.id} emptyMessage="No actions yet — add the first one." />
            </CardContent>
          </Card>

          <div className="mt-6">
            <ActionForm ncrId={ncr.id} employees={employees} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(ncr.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span>{ncr.source}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Severity</span><span>{ncr.severity}</span></div>
              <p className="border-t pt-2 text-muted-foreground">{ncr.description}</p>
            </CardContent>
          </Card>
          <Link href={`/iso${ncr.project ? `?projectId=${ncr.project.id}` : ""}`} className="inline-block text-sm text-primary hover:underline">
            ← Back to ISO Compliance
          </Link>
        </div>
      </div>
    </div>
  );
}
