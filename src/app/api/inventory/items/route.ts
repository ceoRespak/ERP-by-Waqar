import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listItems, createItem } from "@/server/inventory/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  try {
    const items = await listItems();
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createItem({
      code: body.code,
      name: body.name,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      unit: body.unit,
      reorderLevel: body.reorderLevel ? Number(body.reorderLevel) : 0,
      openingStock: body.openingStock ? Number(body.openingStock) : 0,
      description: body.description ?? null,
    });
    return ok({ item: record });
  } catch (e) {
    return handleError(e);
  }
}
