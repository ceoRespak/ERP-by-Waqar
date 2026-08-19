import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { listCostAlerts, resolveCostAlert } from "@/server/budget/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ alerts: await listCostAlerts(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const alertId = body?.id ? Number(body.id) : null;
  const alert = Number.isFinite(alertId) ? await prisma.costAlert.findUnique({ where: { id: alertId as number }, select: { projectId: true } }) : null;
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_UPDATE, alert?.projectId ?? null);
  if (!user) return unauthorized();
  if (!body?.id) return fail("id is required");
  try {
    return ok({ alert: await resolveCostAlert(Number(body.id)) });
  } catch (e) {
    return handleError(e);
  }
}
