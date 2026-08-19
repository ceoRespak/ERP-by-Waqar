import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { approveDevice, rejectDevice, unregisterDevice } from "@/server/hr/devices";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_APPROVE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    if (body?.action === "approve") return ok({ device: await approveDevice(Number(id), Number(user.id)) });
    if (body?.action === "reject") return ok({ device: await rejectDevice(Number(id), Number(user.id)) });
    if (body?.action === "unregister") return ok(await unregisterDevice(Number(id)));
    return unauthorized("Unknown action");
  } catch (e) {
    return handleError(e);
  }
}
