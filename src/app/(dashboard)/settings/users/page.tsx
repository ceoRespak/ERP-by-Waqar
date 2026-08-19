import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listUsers } from "@/server/settings/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { UserForm } from "@/components/settings/user-form";

type Row = Awaited<ReturnType<typeof listUsers>>[number];

const columns: Column<Row>[] = [
  {
    key: "name",
    header: "Name",
    render: (r) => (
      <Link href={`/settings/users/${r.id}`} className="font-medium text-primary hover:underline">
        {r.name}
      </Link>
    ),
  },
  { key: "email", header: "Email", render: (r) => r.email },
  { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
  { key: "projects", header: "Projects", render: (r) => r._count.projectAssignments },
  { key: "grants", header: "Permission Grants", render: (r) => r._count.projectPermissionGrants },
  { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
];

export default async function UsersPage() {
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Create users (basic profile) — then assign projects and per-project permissions." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={users} rowKey={(r) => r.id} emptyMessage="No users yet." />
        </div>
        <UserForm />
      </div>
    </div>
  );
}
