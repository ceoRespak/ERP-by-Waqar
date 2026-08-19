import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { markNotificationRead } from "@/server/hr/notifications";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await markNotificationRead(Number(id), Number(user.id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
