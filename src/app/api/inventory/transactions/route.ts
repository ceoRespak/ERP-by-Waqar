import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listStockTransactions, createStockAdjustment } from "@/server/inventory/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  try {
    return ok({ transactions: await listStockTransactions() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.itemId || !body?.warehouseId || body?.quantity == null)
    return fail("itemId, warehouseId and quantity are required");
  try {
    const record = await createStockAdjustment({
      itemId: Number(body.itemId),
      warehouseId: Number(body.warehouseId),
      quantity: Number(body.quantity),
      notes: body.notes ?? null,
      createdById: Number(user.id),
    });
    return ok({ transaction: record });
  } catch (e) {
    return handleError(e);
  }
}
