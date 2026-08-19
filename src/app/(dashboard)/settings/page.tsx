import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listUsers } from "@/server/settings/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { UserForm } from "@/components/settings/user-form";
import { Avatar } from "@/components/ui/avatar";

type Row = Awaited<ReturnType<typeof listUsers>>[number];

const columns: Column<Row>[] = [
  { key: "user", header: "User", render: (r) => (
    <div className="flex items-center gap-3">
      <Avatar name={r.name} className="h-8 w-8" />
      <div>
        <p className="font-medium">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.email}</p>
      </div>
    </div>
  ) },
  {
    key: "roles",
    header: "Roles",
    render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.roles.length === 0 ? <span className="text-muted-foreground">—</span> : r.roles.map((u) => (
          <Badge key={u.roleId} variant="secondary">{u.role.name}</Badge>
        ))}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
  { key: "lastLoginAt", header: "Last Login", render: (r) => (r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleDateString() : "—") },
];

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Access"
        description="Create users (basic profile) then assign projects and per-project permissions. Roles are reusable permission templates."
        actionHref="/settings/roles"
        actionLabel="Manage Roles & Permissions"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={users} rowKey={(r) => r.id} emptyMessage="No users yet." />
        </div>
        <UserForm />
      </div>
    </div>
  );
}
