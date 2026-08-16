import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVariationOrders, createVariationOrder } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ variations: await listVariationOrders(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.title || !body?.amount) return fail("projectId, title and amount are required");
  try {
    return ok({
      variation: await createVariationOrder({
        projectId: Number(body.projectId),
        title: body.title,
        description: body.description ?? null,
        amount: Number(body.amount),
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}
