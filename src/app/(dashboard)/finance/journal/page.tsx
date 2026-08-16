import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listJournalEntries } from "@/server/finance/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { JournalForm } from "@/components/finance/journal-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listJournalEntries>>[number];

const columns: Column<Row>[] = [
  { key: "entryNo", header: "Entry", render: (r) => <span className="font-medium">{r.entryNo}</span> },
  { key: "description", header: "Description" },
  { key: "lines", header: "Lines", className: "text-right", render: (r) => r.lines.length },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (r) =>
      r.status === "DRAFT" || r.status === "REJECTED" ? (
        <SubmitToApprovalButton apiPath={`/api/finance/journal/${r.id}/submit`} label="Post for Approval" />
      ) : null,
  },
];

export default async function JournalPage() {
  await requirePermission(PERMISSIONS.FINANCE_READ);
  const [entries, accounts] = await Promise.all([
    listJournalEntries(),
    prisma.account.findMany({ select: { id: true, code: true, name: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Journal Entries" description="Double-entry transactions. Posting goes through the approval workflow." />
      <DataTable columns={columns} rows={entries} rowKey={(r) => r.id} emptyMessage="No journal entries yet." />
      <div className="mx-auto max-w-4xl">
        <JournalForm accounts={accounts} />
      </div>
    </div>
  );
}
