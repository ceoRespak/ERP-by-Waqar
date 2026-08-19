import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLeaveRequests, applyLeave } from "@/server/hr/leaves";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  try {
    return ok({
      leaves: await listLeaveRequests({
        status: searchParams.get("status") ?? undefined,
        employeeId: searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.fromDate || !body?.toDate || !body?.reason || !body?.leaveType) {
    return fail("employeeId, leaveType, fromDate, toDate and reason are required");
  }
  try {
    const record = await applyLeave({
      employeeId: Number(body.employeeId),
      leaveType: String(body.leaveType),
      fromDate: body.fromDate,
      toDate: body.toDate,
      reason: body.reason,
      contactDuringLeave: body.contactDuringLeave ?? null,
      alternateArrangements: body.alternateArrangements ?? null,
      isHalfDay: !!body.isHalfDay,
      appliedById: Number(user.id),
    });
    return ok({ leave: record });
  } catch (e) {
    return handleError(e);
  }
}
