import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { updateCorrespondenceStatus } from "@/server/correspondence/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

const ALLOWED = ["DRAFT", "SENT", "RECEIVED", "FILED"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await prisma.correspondence.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
  const user = await apiRequirePermission(PERMISSIONS.CORRESPONDENCE_UPDATE, entity?.projectId ?? null);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.status || !ALLOWED.includes(body.status)) return fail("A valid status is required");
  try {
    return ok({ item: await updateCorrespondenceStatus(Number(id), body.status) });
  } catch (e) {
    return handleError(e);
  }
}
