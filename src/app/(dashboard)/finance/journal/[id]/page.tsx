import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getJournalEntry } from "@/server/finance/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { formatDate, formatNumber } from "@/lib/utils";
import { ScrollText, Scale, CalendarDays, ListChecks } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function JournalDetailPage({ params }: Props) {
  const { id } = await params;
  await requirePermission(PERMISSIONS.FINANCE_READ);
  const entry = await getJournalEntry(Number(id));
  if (!entry) notFound();

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit.toNumber(), 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit.toNumber(), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const lineColumns: Column<(typeof entry.lines)[number]>[] = [
    {
      key: "account",
      header: "Account",
      render: (r) => (
        <>
          <span className="font-medium">{r.account.name}</span>
          <span className="block text-xs text-muted-foreground">{r.account.code}</span>
        </>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (r) => (r.project ? `${r.project.code} — ${r.project.name}` : "—"),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (r) => (r.vendor ? r.vendor.name : "—"),
    },
    { key: "debit", header: "Debit", className: "text-right", render: (r) => formatNumber(r.debit) },
    { key: "credit", header: "Credit", className: "text-right", render: (r) => formatNumber(r.credit) },
    { key: "notes", header: "Notes", render: (r) => r.notes ?? "—" },
  ];

  const statCards = [
    { label: "Total Debit", value: formatNumber(totalDebit), icon: Scale, accent: "from-emerald-500 to-teal-600" },
    { label: "Total Credit", value: formatNumber(totalCredit), icon: Scale, accent: "from-rose-500 to-pink-600" },
    { label: "Date", value: formatDate(entry.date), icon: CalendarDays, accent: "from-sky-500 to-blue-600" },
    { label: "Lines", value: String(entry.lines.length), icon: ListChecks, accent: "from-amber-500 to-orange-600" },
  ];

  const lineVendors = [...new Set(entry.lines.map((l) => l.vendor?.name).filter(Boolean))] as string[];
  const lineProjects = [...new Set(entry.lines.map((l) => (l.project ? `${l.project.code} — ${l.project.name}` : "")).filter(Boolean))] as string[];
  const partyLabel =
    [lineVendors.length ? `Vendors: ${lineVendors.join(", ")}` : "", lineProjects.length ? `Customers: ${lineProjects.join(", ")}` : ""].filter(Boolean).join(" · ") || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${entry.entryNo} — ${entry.description}`}
        description={[balanced ? "Balanced double-entry journal entry." : "Journal entry is NOT balanced.", partyLabel].filter(Boolean).join(" · ")}
        hero
        icon={ScrollText}
      >
        <Badge variant={statusVariant(entry.status)} className="bg-white/20 text-white ring-1 ring-white/30">
          {entry.status}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 truncate text-xl font-bold">{c.value}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="inv-card-header">
          <CardTitle className="text-base text-white">Entry Lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={lineColumns} rows={entry.lines} rowKey={(r) => r.id} emptyMessage="No lines." headerClassName="fin-table-head" zebra />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/finance/journal" className="inline-block text-sm font-medium text-sky-600 hover:underline">
          ← Back to Journal Entries
        </Link>
        {entry.status === "DRAFT" || entry.status === "REJECTED" ? (
          <SubmitToApprovalButton apiPath={`/api/finance/journal/${entry.id}/submit`} label="Post for Approval" />
        ) : null}
      </div>
    </div>
  );
}
