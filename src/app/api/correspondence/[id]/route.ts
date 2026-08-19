import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getCorrespondenceDetail } from "@/server/correspondence/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.correspondence.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.CORRESPONDENCE_READ, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    return ok({ item: await getCorrespondenceDetail(Number(id)) });
  } catch (e) {
    return handleError(e);
  }
}
