import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { markSelfAttendance } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.projectId || !body?.action) return fail("employeeId, projectId and action are required");
  try {
    const record = await markSelfAttendance({
      userId: Number(user.id),
      employeeId: Number(body.employeeId),
      projectId: Number(body.projectId),
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
      deviceId: body.deviceId ?? null,
      facePhoto: body.facePhoto ?? null,
      action: body.action,
      method: "gps",
    });
    return ok({ attendance: record });
  } catch (e) {
    return handleError(e);
  }
}
