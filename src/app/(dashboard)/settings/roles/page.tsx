import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listRoles, listPermissions } from "@/server/settings/service";
import { PageHeader } from "@/components/ui/page-header";
import { RoleForm } from "@/components/settings/role-form";
import { RoleCard, type Role as RoleCardRole } from "@/components/settings/role-card";

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const [roles, permissions] = await Promise.all([listRoles(), listPermissions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Define roles and grant read / create / update / delete / approve permissions per module."
        actionHref="/settings"
        actionLabel="Back to Users"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role as unknown as RoleCardRole} permissions={permissions} />
          ))}
        </div>
        <RoleForm />
      </div>
    </div>
  );
}
