import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { toggleApprovalChain, deleteApprovalChain } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.isActive == null) return fail("isActive is required");
  try {
    const chain = await toggleApprovalChain(Number(id), Boolean(body.isActive));
    return ok({ chain });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteApprovalChain(Number(id));
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
