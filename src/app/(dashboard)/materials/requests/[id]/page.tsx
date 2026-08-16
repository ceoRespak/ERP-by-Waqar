import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getMaterialRequestDetail } from "@/server/materials/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { formatDate, formatNumber } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function MaterialRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.MATERIALS_READ);
  const req = await getMaterialRequestDetail(Number(id));
  if (!req) notFound();

  const items = req.items;
  const totalQty = items.reduce((s, i) => s + i.quantity.toNumber(), 0);
  const issuedQty = items.reduce((s, i) => s + i.issuedQty.toNumber(), 0);

  const columns: Column<(typeof items)[number]>[] = [
    { key: "description", header: "Description", render: (r) => <span className="font-medium">{r.description}</span> },
    { key: "item", header: "Item", render: (r) => (r.item ? `${r.item.code} — ${r.item.name}` : "—") },
    { key: "quantity", header: "Qty", className: "text-right", render: (r) => formatNumber(r.quantity) },
    { key: "unit", header: "Unit", render: (r) => r.unit },
    {
      key: "issuedQty",
      header: "Issued",
      className: "text-right",
      render: (r) => (
        <span className={r.issuedQty.toNumber() >= r.quantity.toNumber() ? "text-emerald-600" : ""}>{formatNumber(r.issuedQty)}</span>
      ),
    },
    {
      key: "remaining",
      header: "Remaining",
      className: "text-right",
      render: (r) => formatNumber(Math.max(0, r.quantity.toNumber() - r.issuedQty.toNumber())),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={req.mrNo}
          description={`${req.project.name} · ${req.activity ? `${req.activity.wbsCode} ${req.activity.name}` : "No activity"} · required ${req.requiredDate ? formatDate(req.requiredDate) : "—"}`}
        />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(req.status)}>{req.status.replace("_", " ")}</Badge>
          {req.status === "DRAFT" || req.status === "REJECTED" ? (
            <SubmitToApprovalButton apiPath={`/api/materials/requests/${req.id}/submit`} />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requested Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} rows={items} rowKey={(r) => r.id} emptyMessage="No items." />
              <div className="flex justify-end gap-6 border-t bg-muted/40 px-3 py-2 text-sm">
                <span>
                  Requested <span className="font-medium">{formatNumber(totalQty)}</span>
                </span>
                <span>
                  Issued <span className="font-medium">{formatNumber(issuedQty)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Issues Against This Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {req.issues.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No issues yet.</p>}
              {req.issues.map((iss) => (
                <div key={iss.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="font-mono text-xs font-medium">{iss.issueNo}</span>
                  <span className="text-muted-foreground">{formatDate(iss.issueDate)}</span>
                  <span className="text-muted-foreground">{iss.items.length} line(s)</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{req.notes ?? "No notes."}</p>
            </CardContent>
          </Card>
          <Link href={`/materials?projectId=${req.project.id}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Back to Materials
          </Link>
        </div>
      </div>
    </div>
  );
}
