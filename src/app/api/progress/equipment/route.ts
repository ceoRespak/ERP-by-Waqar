import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listEquipments, createEquipment } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  try {
    return ok({ equipments: await listEquipments(Number(projectId)) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.code || !body?.name) {
    return fail("projectId, code and name are required");
  }
  try {
    const record = await createEquipment({
      projectId: Number(body.projectId),
      code: body.code,
      name: body.name,
      type: body.type ?? null,
      capacity: body.capacity ?? null,
      status: body.status ?? "ACTIVE",
    });
    return ok({ equipment: record });
  } catch (e) {
    return handleError(e);
  }
}
