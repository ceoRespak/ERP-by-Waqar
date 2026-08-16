import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { createEquipmentUsage } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.equipmentId || !body?.projectId || !body?.hours) {
    return fail("equipmentId, projectId and hours are required");
  }
  try {
    const record = await createEquipmentUsage({
      equipmentId: Number(body.equipmentId),
      projectId: Number(body.projectId),
      date: body.date ?? null,
      hours: Number(body.hours),
      operatorEmployeeId: body.operatorEmployeeId ? Number(body.operatorEmployeeId) : null,
      notes: body.notes ?? null,
    });
    return ok({ usage: record });
  } catch (e) {
    return handleError(e);
  }
}
