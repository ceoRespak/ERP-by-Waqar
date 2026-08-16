import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLeaveRequests, createLeaveRequest } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ leaves: await listLeaveRequests() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.fromDate || !body?.toDate || !body?.reason) {
    return fail("employeeId, fromDate, toDate and reason are required");
  }
  try {
    const record = await createLeaveRequest({
      employeeId: Number(body.employeeId),
      leaveType: body.leaveType ?? "CASUAL",
      fromDate: body.fromDate,
      toDate: body.toDate,
      days: body.days ? Number(body.days) : 1,
      reason: body.reason,
    });
    return ok({ leave: record });
  } catch (e) {
    return handleError(e);
  }
}
