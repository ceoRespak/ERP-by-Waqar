import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deleteIpcLine } from "@/server/cost/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { lineId } = await params;
  const line = await prisma.iPCLine.findUnique({ where: { id: Number(lineId) }, include: { ipc: { select: { projectId: true } } } });
  const user = await apiRequirePermission(PERMISSIONS.COST_DELETE, line?.ipc?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    return ok({ deleted: await deleteIpcLine(Number(lineId)) });
  } catch (e) {
    return handleError(e);
  }
}
