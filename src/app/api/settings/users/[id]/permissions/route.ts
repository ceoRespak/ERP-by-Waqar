import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { setUserProjectPermissions, applyRoleToUserProject } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

/**
 * Set a user's permission grants for one project.
 * Body:
 *   { projectId: number | null, permissionKeys: string[] }
 *   — projectId null = company-wide (global) grants
 *   { roleId: number, projectId: number | null } → materialize a role template
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const userId = Number(id);

  try {
    if (body?.roleId != null) {
      const projectId = body.projectId != null ? Number(body.projectId) : null;
      const result = await applyRoleToUserProject(userId, projectId, Number(body.roleId));
      return ok(result);
    }
    if (!Array.isArray(body?.permissionKeys)) return fail("permissionKeys array is required");
    const projectId = body.projectId != null ? Number(body.projectId) : null;
    const result = await setUserProjectPermissions(userId, projectId, body.permissionKeys as string[]);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
