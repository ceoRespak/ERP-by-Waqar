import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { submitPurchaseOrder } from "@/server/procurement/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_CREATE);
  if (!user) return unauthorized();
  const { id } = await params;
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
