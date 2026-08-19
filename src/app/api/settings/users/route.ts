import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listUsers, createUser, listRoles } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

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
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name) {
    return fail("email, password and name are required");
  }
  try {
    const record = await createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone ?? null,
      roleIds: (body.roleIds ?? []).map(Number),
    });
    return ok({ user: record });
  } catch (e) {
    return handleError(e);
  }
}
