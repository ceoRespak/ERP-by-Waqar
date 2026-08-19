import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listBudgets, createBudget } from "@/server/budget/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ budgets: await listBudgets(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.projectId || !body?.name) return fail("projectId and name are required");
  try {
    const record = await createBudget({
      projectId: Number(body.projectId),
      name: body.name,
      period: body.period ?? null,
      lines: Array.isArray(body.lines) ? body.lines : [],
    });
    return ok({ budget: record });
  } catch (e) {
    return handleError(e);
  }
}
