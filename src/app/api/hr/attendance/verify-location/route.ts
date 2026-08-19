import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { verifyLocation } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || body?.lat == null || body?.lng == null) return fail("projectId, lat and lng are required");
  try {
    return ok(await verifyLocation(Number(body.projectId), Number(body.lat), Number(body.lng)));
  } catch (e) {
    return handleError(e);
  }
}
