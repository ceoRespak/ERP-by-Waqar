import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { assignProjectRole } from "@/server/hr/projects";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.role || !["projectManagerId", "siteSupervisorId"].includes(body.role)) return fail("role must be projectManagerId or siteSupervisorId");
  try {
    const project = await assignProjectRole(Number(id), body.role, body.employeeId ? Number(body.employeeId) : null);
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}
