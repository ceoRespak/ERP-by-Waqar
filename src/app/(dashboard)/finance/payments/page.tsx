import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPayments } from "@/server/finance/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { SubmitToApprovalButton } from "@/components/approvals/submit-button";
import { PaymentForm } from "@/components/finance/payment-form";
import { formatDate, formatMoney } from "@/lib/utils";
import { Banknote } from "lucide-react";

type Row = Awaited<ReturnType<typeof listPayments>>[number];

const columns: Column<Row>[] = [
  { key: "paymentNo", header: "Payment No", render: (r) => <span className="font-medium">{r.paymentNo}</span> },
  {
    key: "type",
    header: "Type",
    render: (r) => <Badge variant={r.type === "IN" ? "success" : "warning"}>{r.type === "IN" ? "IN (Receipt)" : "OUT (Payment)"}</Badge>,
  },
  { key: "account", header: "Account", render: (r) => r.account.name },
  { key: "amount", header: "Amount", className: "text-right", render: (r) => formatMoney(r.amount) },
  { key: "method", header: "Method" },
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
      r.status === "DRAFT" || r.status === "PENDING" || r.status === "REJECTED" ? (
        <SubmitToApprovalButton apiPath={`/api/finance/payments/${r.id}/submit`} label="Submit" />
      ) : null,
  },
];

export default async function PaymentsPage() {
  await requirePermission(PERMISSIONS.FINANCE_READ);
  const [payments, accounts] = await Promise.all([
    listPayments(),
    prisma.account.findMany({ select: { id: true, code: true, name: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Payments in and out, routed through the approval workflow." hero icon={Banknote} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={payments} rowKey={(r) => r.id} emptyMessage="No payments yet." headerClassName="inv-table-head" zebra />
        </div>
        <PaymentForm accounts={accounts} />
      </div>
    </div>
  );
}
