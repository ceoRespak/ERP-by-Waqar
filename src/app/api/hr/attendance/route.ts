import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAttendance, markAttendance } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ attendance: await listAttendance() });
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
      date: body.date,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
      status: body.status ?? "PRESENT",
      notes: body.notes ?? null,
    });
    return ok({ attendance: record });
  } catch (e) {
    return handleError(e);
  }
}
