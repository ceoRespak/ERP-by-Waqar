import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { addIpcLine } from "@/server/cost/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.iPC.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.COST_CREATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
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
