import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDailyWages, markDailyWageAttendance, approveDailyWage, dailyWageMonthlyReport } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  if (searchParams.get("view") === "monthly") {
    try {
      return ok(await dailyWageMonthlyReport(Number(searchParams.get("month")) || new Date().getMonth() + 1, Number(searchParams.get("year")) || new Date().getFullYear(), {
        projectId: searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined,
      }));
    } catch (e) {
      return handleError(e);
    }
  }
  try {
    return ok(
      await listDailyWages({
        month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
        year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
        projectId: searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (body?.action === "approve" && body?.id) {
    try {
      const record = await approveDailyWage(Number(body.id), Number(user.id));
      return ok({ dailyWage: record });
    } catch (e) {
      return handleError(e);
    }
  }
  if (!body?.cnic || !body?.projectId || !body?.date) return fail("cnic, projectId and date are required");
  try {
    const record = await markDailyWageAttendance({
      cnic: body.cnic,
      projectId: Number(body.projectId),
      date: body.date,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
      amount: body.amount ? Number(body.amount) : undefined,
      markedById: Number(user.id),
    });
    return ok({ dailyWage: record });
  } catch (e) {
    return handleError(e);
  }
}
