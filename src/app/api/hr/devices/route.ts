import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDeviceRegistrations, registerDevice } from "@/server/hr/devices";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ devices: await listDeviceRegistrations() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.deviceId) return fail("deviceId is required");
  try {
    const device = await registerDevice(Number(user.id), body.deviceId, body.deviceName ?? null);
    return ok({ device });
  } catch (e) {
    return handleError(e);
  }
}
