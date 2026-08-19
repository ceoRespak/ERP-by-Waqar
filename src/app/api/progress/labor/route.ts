import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLaborLogs, createLaborLog } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_READ, Number(projectId));
  if (!user) return unauthorized();
  try {
    return ok({ laborLogs: await listLaborLogs(Number(projectId)) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
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
