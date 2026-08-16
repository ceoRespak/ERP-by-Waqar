import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listRisks, createRisk } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ risks: await listRisks(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.hazard) return fail("hazard is required");
  try {
    return ok(
      await createRisk({
        projectId: body.projectId ? Number(body.projectId) : null,
        activityId: body.activityId ? Number(body.activityId) : null,
        date: body.date ?? null,
        hazard: body.hazard,
        risk: body.risk ?? null,
        likelihood: Number(body.likelihood || 1),
        severity: Number(body.severity || 1),
        controlMeasures: body.controlMeasures ?? null,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
