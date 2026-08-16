import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { deleteBoqItem } from "@/server/boq/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.BOQ_UPDATE);
  if (!user) return unauthorized();
  const { id, itemId } = await params;
  try {
    const result = await deleteBoqItem(Number(id), Number(itemId));
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
