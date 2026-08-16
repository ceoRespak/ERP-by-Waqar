import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCostLogs, createCostLog } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ costLogs: await listCostLogs(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.description || !body?.amount) return fail("projectId, description and amount are required");
  try {
    return ok({
      costLog: await createCostLog({
        projectId: Number(body.projectId),
        costCenterId: body.costCenterId ? Number(body.costCenterId) : null,
        date: body.date ?? null,
        costType: body.costType ?? "MATERIAL",
        description: body.description,
        amount: Number(body.amount),
        refType: body.refType ?? null,
        refId: body.refId ? Number(body.refId) : null,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}
