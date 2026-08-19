import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listNotifications, unreadNotificationCount } from "@/server/hr/notifications";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  try {
    return ok(await listNotifications(Number(user.id), page));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  try {
    if (body?.readAll) {
      const { markAllNotificationsRead } = await import("@/server/hr/notifications");
      await markAllNotificationsRead(Number(user.id));
      return ok({ ok: true });
    }
    return ok({ unread: await unreadNotificationCount(Number(user.id)) });
  } catch (e) {
    return handleError(e);
  }
}
