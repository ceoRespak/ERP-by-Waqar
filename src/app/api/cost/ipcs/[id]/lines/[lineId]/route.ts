import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { deleteIpcLine } from "@/server/cost/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.COST_DELETE);
  if (!user) return unauthorized();
  const { lineId } = await params;
  try {
    return ok({ deleted: await deleteIpcLine(Number(lineId)) });
  } catch (e) {
    return handleError(e);
  }
}
