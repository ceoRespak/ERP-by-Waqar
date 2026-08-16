import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listItemCategories, createItemCategory } from "@/server/inventory/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_READ);
  if (!user) return unauthorized();
  try {
    return ok({ categories: await listItemCategories() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.INVENTORY_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.name) return fail("name is required");
  try {
    return ok({ category: await createItemCategory({ name: body.name, description: body.description ?? null }) });
  } catch (e) {
    return handleError(e);
  }
}
