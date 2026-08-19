import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCirculars, createCircular, unreadCircularCount } from "@/server/hr/circulars";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  try {
    if (searchParams.get("view") === "unread") {
      return ok({ unread: await unreadCircularCount(Number(user.id)) });
    }
    return ok({ circulars: await listCirculars((user.roles as string[])[0] ?? null) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.message) return fail("title and message are required");
  try {
    const circular = await createCircular({
      title: body.title,
      message: body.message,
      attachment: body.attachment ?? null,
      attachmentName: body.attachmentName ?? null,
      targetRoles: body.targetRoles ?? null,
      priority: body.priority ?? "normal",
      createdById: Number(user.id),
    });
    return ok({ circular });
  } catch (e) {
    return handleError(e);
  }
}
