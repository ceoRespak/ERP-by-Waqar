import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCostCenters, createCostCenter } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.COST_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ costCenters: await listCostCenters(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    return ok({
      costCenter: await createCostCenter({
        projectId: body.projectId ? Number(body.projectId) : null,
        code: body.code,
        name: body.name,
        parentId: body.parentId ? Number(body.parentId) : null,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}
