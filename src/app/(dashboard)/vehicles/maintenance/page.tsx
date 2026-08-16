import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listMaintenances } from "@/server/vehicles/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { MaintenanceForm } from "@/components/vehicles/maintenance-form";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listMaintenances>>[number];

const columns: Column<Row>[] = [
  { key: "vehicle", header: "Vehicle", render: (r) => r.vehicle.regNo },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type}</Badge> },
  { key: "description", header: "Description" },
  { key: "cost", header: "Cost", className: "text-right", render: (r) => formatMoney(r.cost) },
  { key: "nextDueKm", header: "Next Due KM", className: "text-right", render: (r) => (r.nextDueKm ? r.nextDueKm.toString() : "—") },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>,
  },
];

export default async function MaintenancePage() {
  await requirePermission(PERMISSIONS.VEHICLES_READ);
  const [maintenances, vehicles, vendors] = await Promise.all([
    listMaintenances(),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" }, select: { id: true, regNo: true }, orderBy: { regNo: "asc" } }),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicle Maintenance" description="Service, repairs and scheduled maintenance records." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={maintenances} rowKey={(r) => r.id} emptyMessage="No maintenance records yet." />
        </div>
        <MaintenanceForm vehicles={vehicles} vendors={vendors} />
      </div>
    </div>
  );
}
