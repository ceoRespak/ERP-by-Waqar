import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listBudgets, createBudget } from "@/server/budget/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ budgets: await listBudgets(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
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
