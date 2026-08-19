import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { submitMaterialRequest } from "@/server/materials/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.materialRequest.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.MATERIALS_APPROVE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  try {
    return ok(await submitMaterialRequest({ id: Number(id), userId: Number(user.id), userName: user.name ?? "User" }));
  } catch (e) {
    return handleError(e);
  }
}
