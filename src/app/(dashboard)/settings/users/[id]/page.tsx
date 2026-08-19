import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getUserDetail, listPermissionCatalog, listRoles } from "@/server/settings/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { UserPermissionAssigner } from "@/components/settings/user-permission-assigner";
import { formatDate } from "@/lib/utils";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const [user, permissions, roles, projects] = await Promise.all([
    getUserDetail(Number(id)),
    listPermissionCatalog(),
    listRoles(),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!user) notFound();

  const grants = user.projectPermissionGrants.map((g) => ({
    projectId: g.projectId,
    permissionKey: g.permission.key,
  }));
  const assignedProjects = user.projectAssignments.map((pa) => ({ id: pa.projectId, code: pa.project.code, name: pa.project.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={user.name} description={`${user.email} · created ${formatDate(user.createdAt)}`} />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
          {(user.roles ?? []).length > 0 && <Badge variant="secondary">{user.roles.map((r) => r.role.name).join(", ")}</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserPermissionAssigner
            userId={user.id}
            permissions={permissions as never}
            initialGrants={grants}
            assignedProjects={assignedProjects}
            allProjects={projects}
            roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Phone</span><span>{user.phone ?? "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Projects</span><span>{user.projectAssignments.length}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Granted Permissions</span><span>{user.projectPermissionGrants.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Login</span><span>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}</span></div>
            </CardContent>
          </Card>
          <Link href="/settings/users" className="inline-block text-sm text-primary hover:underline">← Back to Users</Link>
        </div>
      </div>
    </div>
  );
}
