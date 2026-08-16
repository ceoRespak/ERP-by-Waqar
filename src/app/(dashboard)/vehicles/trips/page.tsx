import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listTrips } from "@/server/vehicles/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TripForm } from "@/components/vehicles/trip-form";
import { formatDate, formatNumber } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listTrips>>[number];

const columns: Column<Row>[] = [
  { key: "vehicle", header: "Vehicle", render: (r) => r.vehicle.regNo },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "purpose", header: "Purpose" },
  { key: "project", header: "Project", render: (r) => (r.project ? `${r.project.code} — ${r.project.name}` : "—") },
  { key: "startKm", header: "Start KM", className: "text-right", render: (r) => (r.startKm ? formatNumber(r.startKm) : "—") },
  { key: "endKm", header: "End KM", className: "text-right", render: (r) => (r.endKm ? formatNumber(r.endKm) : "—") },
  {
    key: "distance",
    header: "Distance",
    className: "text-right",
    render: (r) => (r.startKm && r.endKm ? formatNumber(r.endKm.toNumber() - r.startKm.toNumber()) : "—"),
  },
];

export default async function TripsPage() {
  await requirePermission(PERMISSIONS.VEHICLES_READ);
  const [trips, vehicles, drivers, projects] = await Promise.all([
    listTrips(),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" }, select: { id: true, regNo: true }, orderBy: { regNo: "asc" } }),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Trip Logs" description="Daily trips with odometer readings and project allocation." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={trips} rowKey={(r) => r.id} emptyMessage="No trips logged yet." />
        </div>
        <TripForm vehicles={vehicles} drivers={drivers} projects={projects} />
      </div>
    </div>
  );
}
