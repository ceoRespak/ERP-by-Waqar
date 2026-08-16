import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listIpcs, createIpc } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ ipcs: await listIpcs(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !Array.isArray(body?.lines) || body.lines.length === 0) {
    return fail("projectId and at least one line are required");
  }
  try {
    return ok(
      await createIpc({
        projectId: Number(body.projectId),
        period: body.period ?? null,
        fromDate: body.fromDate ?? null,
        toDate: body.toDate ?? null,
        retention: body.retention ? Number(body.retention) : 0,
        deductions: body.deductions ? Number(body.deductions) : 0,
        lines: body.lines.map((l: { boqItemId?: number; description: string; currentQty: number; rate: number }) => ({
          boqItemId: l.boqItemId ? Number(l.boqItemId) : null,
          description: l.description,
          currentQty: Number(l.currentQty || 0),
          rate: Number(l.rate || 0),
        })),
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
