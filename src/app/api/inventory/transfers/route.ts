import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { createStockTransfer } from "@/server/inventory/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.fromWarehouseId || !body?.toWarehouseId) return fail("fromWarehouseId and toWarehouseId are required");
  if (!Array.isArray(body.items) || body.items.length === 0) return fail("At least one item line is required");
  try {
    const result = await createStockTransfer({
      fromWarehouseId: Number(body.fromWarehouseId),
      toWarehouseId: Number(body.toWarehouseId),
      createdById: Number(user.id),
      notes: body.notes ?? null,
      items: body.items.map((i: { itemId: number; quantity: number }) => ({
        itemId: Number(i.itemId),
        quantity: Number(i.quantity),
      })),
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
