import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCostAlerts, resolveCostAlert } from "@/server/budget/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ alerts: await listCostAlerts(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_UPDATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.id) return fail("id is required");
  try {
    return ok({ alert: await resolveCostAlert(Number(body.id)) });
  } catch (e) {
    return handleError(e);
  }
}
