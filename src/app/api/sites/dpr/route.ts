import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDprs, createDpr } from "@/server/sites/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.SITES_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ dprs: await listDprs(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.SITES_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.projectId || !body?.workDone) return fail("projectId and workDone are required");
  try {
    const record = await createDpr({
      projectId: Number(body.projectId),
      reportDate: body.reportDate ?? null,
      preparedById: Number(user.id),
      preparedByName: user.name ?? null,
      weather: body.weather ?? null,
      workDone: body.workDone,
      manpower: body.manpower ?? null,
      equipment: body.equipment ?? null,
      materialReceived: body.materialReceived ?? null,
      issues: body.issues ?? null,
      nextPlan: body.nextPlan ?? null,
    });
    return ok({ dpr: record });
  } catch (e) {
    return handleError(e);
  }
}
