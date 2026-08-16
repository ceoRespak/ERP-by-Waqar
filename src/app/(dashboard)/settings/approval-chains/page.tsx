import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listApprovalChains } from "@/server/settings/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ApprovalChainForm } from "@/components/settings/approval-chain-form";
import { MODULE_LABELS, ENTITY_TYPE_LABELS } from "@/lib/constants";
import { ChainToggle } from "@/components/settings/chain-toggle";

type Row = Awaited<ReturnType<typeof listApprovalChains>>[number];

export default async function ApprovalChainsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const [chains, roles] = await Promise.all([
    listApprovalChains(),
    prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Workflows"
        description="Configure multi-step approval chains for every transaction type."
        actionHref="/settings"
        actionLabel="Back to Users"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {chains.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No approval chains yet. Create one on the right — without a chain, documents auto-approve.
              </CardContent>
            </Card>
          )}
          {chains.map((chain) => (
            <Card key={chain.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{chain.name}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {MODULE_LABELS[chain.module] ?? chain.module} · {ENTITY_TYPE_LABELS[chain.entityType] ?? chain.entityType}
                    {chain.description ? ` · ${chain.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(chain.isActive ? "ACTIVE" : "INACTIVE")}>
                    {chain.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <ChainToggle chainId={chain.id} isActive={chain.isActive} />
                </div>
              </CardHeader>
              <CardContent>
                <ol className="flex flex-wrap items-center gap-2">
                  {chain.steps.map((step, i) => (
                    <li key={step.id} className="flex items-center gap-2">
                      <span className="rounded-md border bg-muted px-2 py-1 text-xs font-medium">
                        {step.role?.name ?? step.user?.name ?? "Any"}
                      </span>
                      {i < chain.steps.length - 1 && <span className="text-muted-foreground">→</span>}
                    </li>
                  ))}
                  {chain.steps.length === 0 && (
                    <span className="text-sm text-muted-foreground">No steps defined (auto-approves).</span>
                  )}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">{chain._count.requests} request(s) processed</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <ApprovalChainForm roles={roles} />
      </div>
    </div>
  );
}
