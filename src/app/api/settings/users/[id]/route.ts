import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getUserDetail, updateUserRoles, setUserStatus, resetPassword, deleteUser } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const detail = await getUserDetail(Number(id));
    if (!detail) return fail("User not found", 404);
    return ok({ user: detail });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    if (Array.isArray(body?.roleIds)) {
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteUser(Number(id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

