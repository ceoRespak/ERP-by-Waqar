import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDepartments, createDepartment } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ departments: await listDepartments() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.name) return fail("name is required");
  try {
    return ok({ department: await createDepartment({ name: body.name, code: body.code ?? null }) });
  } catch (e) {
    return handleError(e);
  }
}
