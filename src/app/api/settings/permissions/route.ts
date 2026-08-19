import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPermissionCatalog } from "@/server/settings/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_READ);
  if (!user) return unauthorized();
  try {
    const permissions = await listPermissionCatalog();
    const grouped = {
      OPERATIONAL: permissions.filter((p) => p.category === "OPERATIONAL"),
      APPROVAL: permissions.filter((p) => p.category === "APPROVAL"),
      SECTION: permissions.filter((p) => p.category === "SECTION"),
    };
    return ok({ permissions, grouped });
  } catch (e) {
    return handleError(e);
  }
}
