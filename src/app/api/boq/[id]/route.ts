import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getBoqDetail } from "@/server/boq/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.BOQ_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const detail = await getBoqDetail(Number(id));
    if (!detail) return ok({ error: "BOQ not found" }, { status: 404 });
    return ok(detail);
  } catch (e) {
    return handleError(e);
  }
}
