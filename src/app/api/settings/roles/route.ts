import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listRoles, createRole, listPermissions } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ roles: await listRoles(), permissions: await listPermissions() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.name) return fail("name is required");
  try {
    const record = await createRole({
      name: body.name,
      description: body.description ?? null,
      permissionIds: body.permissionIds?.length ? body.permissionIds.map(Number) : [],
    });
    return ok({ role: record });
  } catch (e) {
    return handleError(e);
  }
}
