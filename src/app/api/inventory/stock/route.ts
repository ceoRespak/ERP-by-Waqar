import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { stockLevels } from "@/server/inventory/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  try {
    return ok({ stock: await stockLevels() });
  } catch (e) {
    return handleError(e);
  }
}
