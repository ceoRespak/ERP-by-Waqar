import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { pendingApprovalsForUser } from "@/server/approval/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ApprovalRequest } from "@prisma/client";

type Row = ApprovalRequest & { chain: { name: string } | null };

const columns: Column<Row>[] = [
  {
    key: "id",
    header: "Ref",
    render: (r) => (
      <Link href={`/approvals/${r.id}`} className="font-medium text-primary hover:underline">
        #{r.id}
      </Link>
    ),
  },
  {
    key: "entityType",
    header: "Document",
    render: (r) => (
      <>
        {ENTITY_TYPE_LABELS[r.entityType] ?? r.entityType}
        <span className="block text-xs text-muted-foreground">Record #{r.entityId}</span>
      </>
    ),
  },
  { key: "chain", header: "Workflow", render: (r) => r.chain?.name ?? "Auto-approve" },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "submittedByName", header: "Submitted By", render: (r) => r.submittedByName ?? "—" },
  { key: "submittedAt", header: "Submitted", render: (r) => formatDate(r.submittedAt) },
];

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number(session.user.id);

  const requests = await pendingApprovalsForUser(userId, 100);

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Documents waiting for your action across all modules."
      />
      <DataTable
        columns={columns}
        rows={requests as Row[]}
        rowKey={(r) => r.id}
        emptyMessage="Nothing is waiting for your approval. 🎉"
      />
    </div>
  );
}
