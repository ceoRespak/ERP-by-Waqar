import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deleteBudgetLine } from "@/server/budget/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { lineId } = await params;
  const line = await prisma.budgetLine.findUnique({ where: { id: Number(lineId) }, include: { budget: { select: { projectId: true } } } });
  const user = await apiRequirePermission(PERMISSIONS.BUDGET_DELETE, line?.budget?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    return ok({ deleted: await deleteBudgetLine(Number(lineId)) });
  } catch (e) {
    return handleError(e);
  }
}
