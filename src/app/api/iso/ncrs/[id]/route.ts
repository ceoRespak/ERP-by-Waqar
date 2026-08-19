import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getNcrDetail } from "@/server/iso/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.nCR.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    return ok({ ncr: await getNcrDetail(Number(id)) });
  } catch (e) {
    return handleError(e);
  }
}
