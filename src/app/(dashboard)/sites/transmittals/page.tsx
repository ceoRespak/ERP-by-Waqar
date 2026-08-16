import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listTransmittals } from "@/server/sites/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { TransmittalForm } from "@/components/sites/transmittal-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listTransmittals>>[number];

const columns: Column<Row>[] = [
  { key: "transmittalNo", header: "Transmittal No", render: (r) => <span className="font-medium">{r.transmittalNo}</span> },
  { key: "project", header: "Project", render: (r) => `${r.project.code} — ${r.project.name}` },
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-[260px]">{r.subject}</span> },
  { key: "receiverName", header: "Receiver", render: (r) => r.receiverName ?? "—" },
  { key: "receiverOrg", header: "Org", render: (r) => r.receiverOrg ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function TransmittalsPage() {
  await requirePermission(PERMISSIONS.SITES_READ);
  const [transmittals, projects] = await Promise.all([
    listTransmittals(),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transmittals" description="Dispatch records for site correspondence and documents." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={transmittals} rowKey={(r) => r.id} emptyMessage="No transmittals yet." />
        </div>
        <TransmittalForm projects={projects} />
      </div>
    </div>
  );
}
