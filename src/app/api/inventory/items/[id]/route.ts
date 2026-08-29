import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getItemDetail, updateItem } from "@/server/inventory/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const item = await getItemDetail(Number(id));
    if (!item) return fail("Item not found", 404);
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid request body");
  try {
    const item = await updateItem(Number(id), {
      name: body.name,
      categoryId: body.categoryId != null ? Number(body.categoryId) : null,
      unit: body.unit,
      reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : undefined,
      description: body.description ?? null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      isInventoryItem: typeof body.isInventoryItem === "boolean" ? body.isInventoryItem : undefined,
    });
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}
