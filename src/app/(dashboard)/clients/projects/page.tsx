import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects } from "@/server/clients/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ProjectForm } from "@/components/clients/project-form";
import { formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listProjects>>[number];

const columns: Column<Row>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-medium">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "client", header: "Client", render: (r) => r.client?.name ?? "—" },
  { key: "manager", header: "Manager", render: (r) => (r.manager ? `${r.manager.firstName} ${r.manager.lastName}` : "—") },
  { key: "budget", header: "Budget", className: "text-right", render: (r) => formatMoney(r.budget) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function ProjectsPage() {
  await requirePermission(PERMISSIONS.CLIENTS_READ);
  const [projects, clients, managers] = await Promise.all([
    listProjects(),
    prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Construction projects with budget, client and manager." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={projects} rowKey={(r) => r.id} emptyMessage="No projects yet." />
        </div>
        <ProjectForm clients={clients} managers={managers} />
      </div>
    </div>
  );
}
