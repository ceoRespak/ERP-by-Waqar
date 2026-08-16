import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listClients } from "@/server/clients/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ClientForm } from "@/components/clients/client-form";

type Row = Awaited<ReturnType<typeof listClients>>[number];

const columns: Column<Row>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-medium">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type}</Badge> },
  { key: "contactPerson", header: "Contact" },
  { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
  { key: "projects", header: "Projects", className: "text-right", render: (r) => r._count.projects },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function ClientsPage() {
  await requirePermission(PERMISSIONS.CLIENTS_READ);
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Client master records." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={clients} rowKey={(r) => r.id} emptyMessage="No clients yet." />
        </div>
        <ClientForm />
      </div>
    </div>
  );
}
