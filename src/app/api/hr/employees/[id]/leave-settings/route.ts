import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { updateLeaveSettings } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.balances)) return fail("balances array is required");
  try {
    await updateLeaveSettings(
      Number(id),
      body.balances.map((b: { leaveTypeConfigId: number; total: number }) => ({ leaveTypeConfigId: Number(b.leaveTypeConfigId), total: Number(b.total) }))
    );
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
