import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { salaryReport, buildSalaryXlsx } from "@/server/hr/reports";
import { unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const projectId = searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined;

  const report = await salaryReport(month, year, { projectId });
  const buffer = buildSalaryXlsx(report);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ResPak_Salary_${monthNames[month - 1]}_${year}.xlsx"`,
    },
  });
}
