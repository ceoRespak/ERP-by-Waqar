import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listJournalEntries } from "@/server/finance/service";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { JournalForm } from "@/components/finance/journal-form";
import { formatDate } from "@/lib/utils";
import { ScrollText } from "lucide-react";

type Row = Awaited<ReturnType<typeof listJournalEntries>>[number];

const columns: Column<Row>[] = [
  {
    key: "entryNo",
    header: "Entry",
    render: (r) => (
      <Link href={`/finance/journal/${r.id}`} className="font-medium text-primary hover:underline">
        {r.entryNo}
      </Link>
    ),
  },
  { key: "description", header: "Description" },
  {
    key: "party",
    header: "Party",
    render: (r) =>
      r.vendor ? (
        <Badge variant="info">Vendor · {r.vendor.name}</Badge>
      ) : r.client ? (
        <Badge variant="secondary">Customer · {r.client.name}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
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
  const [entries, accounts, vendors, clients, projects] = await Promise.all([
    listJournalEntries(),
    prisma.account.findMany({ select: { id: true, code: true, name: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.vendor.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Double-entry transactions. Posting goes through the approval workflow."
        hero
        icon={ScrollText}
      />
      <DataTable columns={columns} rows={entries} rowKey={(r) => r.id} emptyMessage="No journal entries yet." headerClassName="fin-table-head" zebra />
      <div className="mx-auto max-w-4xl">
        <JournalForm accounts={accounts} vendors={vendors} clients={clients} projects={projects} />
      </div>
    </div>
  );
}
