import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listMaterialIssues, issueMaterials } from "@/server/materials/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.MATERIALS_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ issues: await listMaterialIssues(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.MATERIALS_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.projectId || !Array.isArray(body?.items) || body.items.length === 0) {
    return fail("projectId and at least one item are required");
  }
  try {
    const issue = await issueMaterials({
      projectId: Number(body.projectId),
      requestId: body.requestId ? Number(body.requestId) : null,
      warehouseId: body.warehouseId ? Number(body.warehouseId) : null,
      issuedById: Number(user.id),
      issuedByName: user.name ?? null,
      notes: body.notes ?? null,
      items: body.items.map((i: { itemId?: number; quantity: number }) => ({
        itemId: i.itemId ? Number(i.itemId) : null,
        quantity: Number(i.quantity || 0),
      })),
    });
    return ok({ issue });
  } catch (e) {
    return handleError(e);
  }
}
