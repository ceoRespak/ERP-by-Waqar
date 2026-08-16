import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ApproveActions } from "@/components/approvals/approve-actions";
import { ENTITY_TYPE_LABELS, MODULE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number(session.user.id);

  const request = await prisma.approvalRequest.findUnique({
    where: { id: Number(id) },
    include: {
      chain: { include: { steps: { orderBy: { stepOrder: "asc" }, include: { role: true, user: true } } } },
      actions: { orderBy: { createdAt: "asc" }, include: { user: true } },
    },
  });

  if (!request) notFound();

  const isPending = request.status === "PENDING";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {ENTITY_TYPE_LABELS[request.entityType] ?? request.entityType}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Module: {MODULE_LABELS[request.module] ?? request.module} · Record #{request.entityId} ·
            Request #{request.id}
          </p>
        </div>
        <Badge variant={statusVariant(request.status)} className="text-sm">
          {request.status}
        </Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.chain ? (
              <ol className="space-y-3">
                {request.chain.steps.map((step, i) => {
                  const isCurrent = step.stepOrder === request.currentStep && isPending;
                  const isDone = step.stepOrder < request.currentStep || !isPending;
                  return (
                    <li key={step.id} className="flex items-start gap-3">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : isDone
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {step.role?.name ?? step.user?.name ?? "Any approver"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isCurrent ? "Awaiting action" : isDone ? "Completed" : "Upcoming"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No chain configured — auto approved.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Submitted by:</span>{" "}
              <span className="font-medium">{request.submittedByName ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Submitted at:</span>{" "}
              {formatDate(request.submittedAt)}
            </p>
            {request.decidedAt && (
              <p>
                <span className="text-muted-foreground">Decided at:</span> {formatDate(request.decidedAt)}
              </p>
            )}
            {request.remarks && (
              <p>
                <span className="text-muted-foreground">Remarks:</span> {request.remarks}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {request.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions recorded.</p>
          ) : (
            <ul className="space-y-4">
              {request.actions.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      a.action === "APPROVE"
                        ? "bg-emerald-500"
                        : a.action === "REJECT"
                          ? "bg-destructive"
                          : "bg-slate-400"
                    }`}
                  />
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">{a.action}</span>
                      {a.userName && <span className="text-muted-foreground"> by {a.userName}</span>}
                      {a.stepOrder > 0 && (
                        <span className="text-muted-foreground"> · Step {a.stepOrder}</span>
                      )}
                    </p>
                    {a.comment && <p className="mt-0.5 text-muted-foreground">{a.comment}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <ApproveActions requestId={request.id} />
          </CardContent>
        </Card>
      )}
      <Separator />
    </div>
  );
}
