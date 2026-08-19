import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDeviceRegistrations } from "@/server/hr/devices";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ReviewActions } from "@/components/hr/review-actions";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listDeviceRegistrations>>[number];

const columns: Column<Row>[] = [
  { key: "owner", header: "User", render: (r) => <span className="font-medium">{r.owner.name}</span> },
  { key: "email", header: "Email", render: (r) => r.owner.email },
  { key: "deviceId", header: "Device ID", render: (r) => <span className="font-mono text-xs">{r.deviceId}</span> },
  { key: "deviceName", header: "Device", render: (r) => r.deviceName ?? "—" },
  { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
  { key: "requestedAt", header: "Requested", render: (r) => formatDate(r.requestedAt) },
  { key: "actions", header: "", className: "text-right", render: (r) => <ReviewActions kind="device" id={r.id} pending={r.status === "pending"} /> },
];

export default async function DevicesPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const devices = await listDeviceRegistrations();

  return (
    <div className="space-y-6">
      <PageHeader title="Device Registrations" description="Approve mobile devices for self attendance (one device per user)." />
      <DataTable columns={columns} rows={devices} rowKey={(r) => r.id} emptyMessage="No device registrations yet." />
    </div>
  );
}
