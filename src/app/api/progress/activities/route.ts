import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listActivities, createActivity } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  try {
    return ok({ activities: await listActivities(Number(projectId)) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.wbsCode || !body?.name) {
    return fail("projectId, wbsCode and name are required");
  }
  try {
    const record = await createActivity({
      projectId: Number(body.projectId),
      parentId: body.parentId ? Number(body.parentId) : null,
      wbsCode: body.wbsCode,
      name: body.name,
      unit: body.unit ?? null,
      totalQty: body.totalQty ? Number(body.totalQty) : 0,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      status: body.status ?? "PLANNED",
    });
    return ok({ activity: record });
  } catch (e) {
    return handleError(e);
  }
}
