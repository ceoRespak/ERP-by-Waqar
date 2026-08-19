import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { approveAttendanceByHR } from "@/server/hr/attendance";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_APPROVE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const record = await approveAttendanceByHR(Number(id), Number(user.id));
    return ok({ attendance: record });
  } catch (e) {
    return handleError(e);
  }
}
