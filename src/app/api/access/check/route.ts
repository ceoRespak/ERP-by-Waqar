import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/permissions";
import { userHasPermission } from "@/lib/access";
import { ok, unauthorized, handleError } from "@/lib/api";

/**
 * Runtime permission check (client-side). Body: { permissionKey, projectId? }
 * Returns { allowed: boolean } — Super Admin always allowed.
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.permissionKey) return ok({ allowed: false });
  try {
    const allowed = await userHasPermission(user, String(body.permissionKey), body.projectId != null ? Number(body.projectId) : null);
    return ok({ allowed });
  } catch (e) {
    return handleError(e);
  }
}
