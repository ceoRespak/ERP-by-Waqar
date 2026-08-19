import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { recordActivityProgress } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.activity.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_CREATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.reportDate || body?.actualQty == null) {
    return fail("reportDate and actualQty are required");
  }
  try {
    const record = await recordActivityProgress({
      activityId: Number(id),
      reportDate: body.reportDate,
      plannedQty: body.plannedQty ? Number(body.plannedQty) : 0,
      actualQty: Number(body.actualQty),
      notes: body.notes ?? null,
    });
    return ok({ progress: record });
  } catch (e) {
    return handleError(e);
  }
}
