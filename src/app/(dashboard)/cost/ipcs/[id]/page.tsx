import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIpcDetail } from "@/server/cost/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { IpcLineForm } from "@/components/cost/ipc-line-form";
import { formatMoney, formatNumber, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function IpcDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.COST_READ);
  const ipc = await getIpcDetail(Number(id));
  if (!ipc) notFound();

  const boqItems = await prisma.bOQItem.findMany({
    select: { id: true, itemCode: true, description: true },
    take: 300,
    orderBy: { itemCode: "asc" },
  });

  const lines = ipc.lines;
  const gross = ipc.grossValue.toNumber();
  const retention = ipc.retention.toNumber();
  const deductions = ipc.deductions.toNumber();
  const net = ipc.netValue.toNumber();

  const columns: Column<(typeof lines)[number]>[] = [
    { key: "description", header: "Description", render: (r) => <span className="font-medium">{r.description}</span> },
    { key: "boqItem", header: "BOQ Item", render: (r) => (r.boqItem ? `${r.boqItem.itemCode}` : "—") },
    { key: "currentQty", header: "Qty", className: "text-right", render: (r) => formatNumber(r.currentQty) },
    { key: "rate", header: "Rate", className: "text-right", render: (r) => formatMoney(r.rate) },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
    {
      key: "actions",
      header: "",
      render: (r) => (ipc.status === "DRAFT" ? <DeleteButton apiPath={`/api/cost/ipcs/${ipc.id}/lines/${r.id}`} confirmMessage="Remove this line?" /> : null),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={ipc.ipcNo}
          description={`${ipc.period ?? "No period"} · ${ipc.project.name} · ${ipc.fromDate ? formatDate(ipc.fromDate) : "—"} → ${ipc.toDate ? formatDate(ipc.toDate) : "—"}`}
        />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(ipc.status)}>{ipc.status}</Badge>
          {ipc.status === "DRAFT" || ipc.status === "PENDING" ? (
            <SubmitToApprovalButton apiPath={`/api/cost/ipcs/${ipc.id}/submit`} label="Submit IPC for Certification" />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work Done Lines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                rows={lines}
                rowKey={(r) => r.id}
                emptyMessage="No lines yet."
              />
              {lines.length > 0 && (
                <div className="flex justify-end border-t bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Gross Value</span>
                  <span className="ml-3 font-medium">{formatMoney(gross)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {ipc.status === "DRAFT" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Add Line</CardTitle>
              </CardHeader>
              <CardContent>
                <IpcLineForm ipcId={ipc.id} boqItems={boqItems} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Value</span>
                <span className="font-medium">{formatMoney(gross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retention</span>
                <span className="font-medium">− {formatMoney(retention)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deductions</span>
                <span className="font-medium">− {formatMoney(deductions)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Net Payable</span>
                <span className="font-semibold text-emerald-600">{formatMoney(net)}</span>
              </div>
            </CardContent>
          </Card>
          <Link href={`/cost?projectId=${ipc.project.id}`} className="text-sm text-primary hover:underline">
            ← Back to Cost Control
          </Link>
        </div>
      </div>
    </div>
  );
}
