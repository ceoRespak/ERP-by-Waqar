import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deleteBoqItem } from "@/server/boq/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await params;
  const entity = await prisma.bOQ.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.BOQ_UPDATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    const result = await deleteBoqItem(Number(id), Number(itemId));
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
