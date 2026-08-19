import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAttendance, markAttendance } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  try {
    return ok({
      attendance: await listAttendance({
        date: searchParams.get("date") ?? undefined,
        month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
        year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
        projectId: searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined,
        employeeId: searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined,
        approvalStatus: searchParams.get("approvalStatus") ?? undefined,
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
  if (!body?.employeeId || !body?.date) return fail("employeeId and date are required");
  try {
    const record = await markAttendance({
      employeeId: Number(body.employeeId),
      projectId: body.projectId ? Number(body.projectId) : null,
      date: body.date,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
      status: body.status ?? null,
      notes: body.notes ?? null,
      method: body.method ?? null,
      createdById: Number(user.id),
    });
    return ok({ attendance: record });
  } catch (e) {
    return handleError(e);
  }
}
