import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listFaceEnrollments } from "@/server/hr/devices";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ReviewActions } from "@/components/hr/review-actions";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listFaceEnrollments>>[number];

const columns: Column<Row>[] = [
  { key: "employee", header: "Employee", render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
  { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.employee.empCode}</span> },
  { key: "user", header: "Submitted By", render: (r) => r.user.name },
  { key: "photo", header: "Photo", render: (r) => (r.photo ? "✓" : "—") },
  { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
  { key: "requestedAt", header: "Requested", render: (r) => formatDate(r.requestedAt) },
  { key: "actions", header: "", className: "text-right", render: (r) => <ReviewActions kind="face" id={r.id} pending={r.status === "pending"} /> },
];

export default async function FaceEnrollmentsPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const enrollments = await listFaceEnrollments();

  return (
    <div className="space-y-6">
      <PageHeader title="Face Enrollments" description="Review and approve face-recognition enrollments for attendance." />
      <DataTable columns={columns} rows={enrollments} rowKey={(r) => r.id} emptyMessage="No face enrollment requests yet." />
    </div>
  );
}
