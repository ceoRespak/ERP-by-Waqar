import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { addBoqItem } from "@/server/boq/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.BOQ_CREATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.itemCode || !body?.description) return fail("itemCode and description are required");
  try {
    const item = await addBoqItem({
      boqId: Number(id),
      parentId: body.parentId ? Number(body.parentId) : null,
      itemCode: body.itemCode,
      description: body.description,
      category: body.category ?? null,
      unit: body.unit ?? "EA",
      quantity: body.quantity ? Number(body.quantity) : 0,
      rate: body.rate ? Number(body.rate) : 0,
    });
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}
