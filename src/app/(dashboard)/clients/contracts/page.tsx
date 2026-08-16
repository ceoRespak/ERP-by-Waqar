import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listContracts } from "@/server/clients/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ContractForm } from "@/components/clients/contract-form";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listContracts>>[number];

const columns: Column<Row>[] = [
  { key: "contractNo", header: "Contract No", render: (r) => <span className="font-medium">{r.contractNo}</span> },
  { key: "client", header: "Client", render: (r) => r.client?.name ?? "—" },
  { key: "title", header: "Title" },
  { key: "project", header: "Project", render: (r) => (r.project ? `${r.project.code} — ${r.project.name}` : "—") },
  { key: "value", header: "Value", className: "text-right", render: (r) => formatMoney(r.value) },
  { key: "startDate", header: "Start", render: (r) => formatDate(r.startDate) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function ContractsPage() {
  await requirePermission(PERMISSIONS.CLIENTS_READ);
  const [contracts, clients, projects] = await Promise.all([
    listContracts(),
    prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Client Contracts" description="Agreements with clients and their values." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={contracts} rowKey={(r) => r.id} emptyMessage="No contracts yet." />
        </div>
        <ContractForm clients={clients} projects={projects} />
      </div>
    </div>
  );
}
