import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AccountForm } from "@/components/finance/account-form";
import { BookOpen } from "lucide-react";

type Account = Awaited<ReturnType<typeof prisma.account.findMany>>[number];

const columns: Column<Account>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-medium">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type}</Badge> },
  { key: "isActive", header: "Status", render: (r) => <Badge variant={statusVariant(r.isActive ? "ACTIVE" : "INACTIVE")}>{r.isActive ? "Active" : "Inactive"}</Badge> },
];

export default async function AccountsPage() {
  await requirePermission(PERMISSIONS.FINANCE_READ);
  const accounts = await prisma.account.findMany({ orderBy: [{ type: "asc" }, { code: "asc" }] });

  return (
    <div className="space-y-6">
      <PageHeader title="Chart of Accounts" description="Ledger structure for all financial transactions." hero icon={BookOpen} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={accounts} rowKey={(r) => r.id} emptyMessage="No accounts yet." headerClassName="inv-table-head" zebra />
        </div>
        <AccountForm accounts={accounts} />
      </div>
    </div>
  );
}
