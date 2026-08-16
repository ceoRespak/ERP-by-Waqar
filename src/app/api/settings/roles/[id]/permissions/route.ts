import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { updateRolePermissions } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.permissionIds) return fail("permissionIds is required");
  try {
    await updateRolePermissions(Number(id), body.permissionIds.map(Number));
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
