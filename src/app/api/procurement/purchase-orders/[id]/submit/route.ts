import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { submitPurchaseOrder } from "@/server/procurement/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.purchaseOrder.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_CREATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    const result = await submitPurchaseOrder({
      id: Number(id),
      userId: Number(user.id),
      userName: user.name ?? "User",
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
