import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLaborLogs, createLaborLog } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  try {
    return ok({ laborLogs: await listLaborLogs(Number(projectId)) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.count) return fail("projectId and count are required");
  try {
    const record = await createLaborLog({
      projectId: Number(body.projectId),
      activityId: body.activityId ? Number(body.activityId) : null,
      date: body.date ?? null,
      laborType: body.laborType ?? null,
      count: Number(body.count),
      notes: body.notes ?? null,
    });
    return ok({ laborLog: record });
  } catch (e) {
    return handleError(e);
  }
}
