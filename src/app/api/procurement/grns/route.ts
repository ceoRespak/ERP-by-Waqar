import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listGrns, createGrn } from "@/server/procurement/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  try {
    const data = await listGrns();
    return ok({ grns: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_CREATE);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.poId || !body?.items?.length) return fail("poId and items are required");

  try {
    const record = await createGrn({
      poId: Number(body.poId),
      warehouseId: body.warehouseId ? Number(body.warehouseId) : null,
      receivedById: Number(user.id),
      receivedByName: user.name ?? null,
      notes: body.notes ?? null,
      items: body.items,
    });
    return ok({ grn: record });
  } catch (e) {
    return handleError(e);
  }
}
