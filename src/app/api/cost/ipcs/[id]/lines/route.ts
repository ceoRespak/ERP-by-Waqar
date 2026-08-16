import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { addIpcLine } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.description) return fail("description is required");
  try {
    return ok(
      await addIpcLine({
        ipcId: Number(id),
        boqItemId: body.boqItemId ? Number(body.boqItemId) : null,
        description: body.description,
        currentQty: Number(body.currentQty || 0),
        rate: Number(body.rate || 0),
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
