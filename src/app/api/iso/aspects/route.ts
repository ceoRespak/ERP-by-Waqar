import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAspects, createAspect } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ aspects: await listAspects(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.activity || !body?.aspect || !body?.impact) return fail("activity, aspect and impact are required");
  try {
    return ok(
      await createAspect({
        projectId: body.projectId ? Number(body.projectId) : null,
        date: body.date ?? null,
        activity: body.activity,
        aspect: body.aspect,
        impact: body.impact,
        significance: body.significance ?? "LOW",
        controlMeasures: body.controlMeasures ?? null,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
