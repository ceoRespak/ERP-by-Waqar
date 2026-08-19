import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { updateLeaveType, deleteLeaveType } from "@/server/hr/leaves";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    const record = await updateLeaveType(Number(id), {
      name: body?.name,
      description: body?.description,
      defaultTotal: body?.defaultTotal != null ? Number(body.defaultTotal) : undefined,
      isPaid: typeof body?.isPaid === "boolean" ? body.isPaid : undefined,
      requiresDocument: body?.requiresDocument,
      color: body?.color,
      sortOrder: body?.sortOrder != null ? Number(body.sortOrder) : undefined,
      isActive: body?.isActive,
    });
    return ok({ leaveType: record });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteLeaveType(Number(id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
