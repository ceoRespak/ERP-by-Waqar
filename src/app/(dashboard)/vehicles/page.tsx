import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVehicles } from "@/server/vehicles/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listVehicles>>[number];

const columns: Column<Row>[] = [
  { key: "regNo", header: "Registration", render: (r) => <span className="font-medium">{r.regNo}</span> },
  { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type}</Badge> },
  { key: "brand", header: "Brand / Model", render: (r) => [r.brand, r.model].filter(Boolean).join(" ") || "—" },
  { key: "fuelType", header: "Fuel" },
  { key: "driver", header: "Driver", render: (r) => (r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "—") },
  { key: "currentKm", header: "KM", className: "text-right", render: (r) => (r.currentKm ? formatNumber(r.currentKm) : "—") },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>,
  },
];

export default async function VehiclesPage() {
  await requirePermission(PERMISSIONS.VEHICLES_READ);
  const [vehicles, drivers] = await Promise.all([
    listVehicles(),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet" description="Vehicle register with driver assignment and current status." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={vehicles} rowKey={(r) => r.id} emptyMessage="No vehicles registered yet." />
        </div>
        <VehicleForm drivers={drivers} />
      </div>
    </div>
  );
}
