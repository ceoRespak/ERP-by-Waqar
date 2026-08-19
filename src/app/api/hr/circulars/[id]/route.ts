import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getCircular, deleteCircular } from "@/server/hr/circulars";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const circular = await getCircular(Number(id), Number(user.id));
    return ok({ circular });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteCircular(Number(id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
