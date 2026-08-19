import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { saveRateAnalysis } from "@/server/boq/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const entity = await prisma.bOQ.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.BOQ_UPDATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.lines?.length) return fail("At least one rate analysis line is required.");
  try {
    const result = await saveRateAnalysis({
      boqItemId: Number(itemId),
      overheadPct: body.overheadPct ? Number(body.overheadPct) : 0,
      profitPct: body.profitPct ? Number(body.profitPct) : 0,
      lines: body.lines,
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
