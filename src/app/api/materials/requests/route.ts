import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listMaterialRequests, createMaterialRequest } from "@/server/materials/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.MATERIALS_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ requests: await listMaterialRequests(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.MATERIALS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !Array.isArray(body?.items) || body.items.length === 0) {
    return fail("projectId and at least one item are required");
  }
  try {
    const record = await createMaterialRequest({
      projectId: Number(body.projectId),
      activityId: body.activityId ? Number(body.activityId) : null,
      requestedById: body.requestedById ? Number(body.requestedById) : null,
      requestedByName: body.requestedByName ?? null,
      requiredDate: body.requiredDate ?? null,
      notes: body.notes ?? null,
      items: body.items.map((i: { itemId?: number; description: string; quantity: number; unit?: string }) => ({
        itemId: i.itemId ? Number(i.itemId) : null,
        description: i.description,
        quantity: Number(i.quantity || 0),
        unit: i.unit || "EA",
      })),
    });
    return ok({ request: record });
  } catch (e) {
    return handleError(e);
  }
}
