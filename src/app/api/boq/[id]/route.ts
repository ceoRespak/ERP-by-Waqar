import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getBoqDetail } from "@/server/boq/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.bOQ.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.BOQ_READ, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    const detail = await getBoqDetail(Number(id));
    if (!detail) return ok({ error: "BOQ not found" }, { status: 404 });
    return ok(detail);
  } catch (e) {
    return handleError(e);
  }
}
