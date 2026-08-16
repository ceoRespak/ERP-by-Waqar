import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPurchaseOrders, createPurchaseOrder } from "@/server/procurement/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_READ);
  if (!user) return unauthorized();
  try {
    const data = await listPurchaseOrders();
    return ok({ purchaseOrders: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_CREATE);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vendorName || !body?.items?.length) return fail("vendorName and at least one item are required");

  try {
    const record = await createPurchaseOrder({
      vendorId: body.vendorId ? Number(body.vendorId) : null,
      vendorName: body.vendorName,
      requisitionId: body.requisitionId ? Number(body.requisitionId) : null,
      projectId: body.projectId ? Number(body.projectId) : null,
      expectedDelivery: body.expectedDelivery ?? null,
      terms: body.terms ?? null,
      items: body.items,
    });
    return ok({ purchaseOrder: record });
  } catch (e) {
    return handleError(e);
  }
}
