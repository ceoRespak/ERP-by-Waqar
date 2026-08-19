import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getHrDashboard } from "@/server/hr/dashboard";
import { prisma } from "@/lib/db";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: Number(user.id) } });
    const data = await getHrDashboard(Number(user.id), (user.roles as string[]) ?? [], employee?.id ?? null);
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
