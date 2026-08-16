import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { updateUserRoles, setUserStatus, resetPassword } from "@/server/settings/service";
import { ok, fail, forbidden, unauthorized, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const hasBypass = user.roles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r));
  if (!hasBypass) return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    if (body?.roleIds) {
      await updateUserRoles(Number(id), body.roleIds.map(Number));
    }
    if (body?.status) {
      await setUserStatus(Number(id), body.status);
    }
    if (body?.password) {
      await resetPassword(Number(id), body.password);
    }
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
