import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listIncidents, createIncident } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ incidents: await listIncidents(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.description) return fail("description is required");
  try {
    return ok(
      await createIncident({
        projectId: body.projectId ? Number(body.projectId) : null,
        date: body.date ?? null,
        incidentType: body.incidentType ?? "NEAR_MISS",
        description: body.description,
        severity: body.severity ?? "MINOR",
        injuredEmployeeId: body.injuredEmployeeId ? Number(body.injuredEmployeeId) : null,
        rootCause: body.rootCause ?? null,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
