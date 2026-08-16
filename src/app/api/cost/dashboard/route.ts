import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getCostDashboard } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  try {
    return ok({ dashboard: await getCostDashboard(Number(projectId)) });
  } catch (e) {
    return handleError(e);
  }
}
