import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listUsers, createUser, listRoles } from "@/server/settings/service";
import { ok, fail, forbidden, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ users: await listUsers(), roles: await listRoles() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_CREATE);
  if (!user) return unauthorized();
  const hasBypass = user.roles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r));
  if (!hasBypass) return forbidden();
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name || !body?.roleIds?.length) {
    return fail("email, password, name and at least one role are required");
  }
  try {
    const record = await createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone ?? null,
      roleIds: body.roleIds.map(Number),
    });
    return ok({ user: record });
  } catch (e) {
    return handleError(e);
  }
}
