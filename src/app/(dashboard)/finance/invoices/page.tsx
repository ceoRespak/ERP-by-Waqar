import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listClientInvoices } from "@/server/finance/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { InvoiceForm } from "@/components/finance/invoice-form";
import { formatDate, formatMoney } from "@/lib/utils";
import { ReceiptText } from "lucide-react";

type Row = Awaited<ReturnType<typeof listClientInvoices>>[number];

const columns: Column<Row>[] = [
  { key: "invoiceNo", header: "Invoice", render: (r) => <span className="font-medium">{r.invoiceNo}</span> },
  { key: "client", header: "Client", render: (r) => r.client?.name ?? "—" },
  { key: "project", header: "Project", render: (r) => (r.project ? `${r.project.code} — ${r.project.name}` : "—") },
  { key: "total", header: "Total", className: "text-right", render: (r) => formatMoney(r.total) },
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
        <SubmitToApprovalButton apiPath={`/api/finance/invoices/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function InvoicesPage() {
  await requirePermission(PERMISSIONS.FINANCE_READ);
  const [invoices, clients, projects] = await Promise.all([
    listClientInvoices(),
    prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Client Invoices" description="Bill clients for projects & services." hero tone="light" icon={ReceiptText} />
      <DataTable columns={columns} rows={invoices} rowKey={(r) => r.id} emptyMessage="No invoices yet." headerClassName="fin-table-head" zebra />
      <div className="mx-auto max-w-4xl">
        <InvoiceForm clients={clients} projects={projects} />
      </div>
    </div>
  );
}
