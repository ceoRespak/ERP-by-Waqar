import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listFuelLogs } from "@/server/vehicles/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FuelForm } from "@/components/vehicles/fuel-form";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listFuelLogs>>[number];

const columns: Column<Row>[] = [
  { key: "vehicle", header: "Vehicle", render: (r) => r.vehicle.regNo },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "liters", header: "Liters", className: "text-right", render: (r) => formatNumber(r.liters) },
  { key: "rate", header: "Rate", className: "text-right", render: (r) => formatMoney(r.rate) },
  { key: "totalCost", header: "Total", className: "text-right", render: (r) => formatMoney(r.totalCost) },
  { key: "vendor", header: "Station", render: (r) => r.vendor?.name ?? "—" },
];

export default async function FuelPage() {
  await requirePermission(PERMISSIONS.VEHICLES_READ);
  const [fuelLogs, vehicles, vendors] = await Promise.all([
    listFuelLogs(),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" }, select: { id: true, regNo: true }, orderBy: { regNo: "asc" } }),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel Logs" description="Fuel consumption and cost per vehicle." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={fuelLogs} rowKey={(r) => r.id} emptyMessage="No fuel logs yet." />
        </div>
        <FuelForm vehicles={vehicles} vendors={vendors} />
      </div>
    </div>
  );
}
