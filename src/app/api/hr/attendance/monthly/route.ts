import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getMonthlyReport } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  if (month < 1 || month > 12) return fail("Invalid month");
  try {
    return ok(
      await getMonthlyReport(month, year, {
        projectId: searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined,
        employeeId: searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
