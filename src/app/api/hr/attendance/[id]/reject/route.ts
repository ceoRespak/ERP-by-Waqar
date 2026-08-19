import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { rejectAttendance } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_APPROVE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.reason) return fail("reason is required");
  try {
    const record = await rejectAttendance(Number(id), Number(user.id), body.reason);
    return ok({ attendance: record });
  } catch (e) {
    return handleError(e);
  }
}
