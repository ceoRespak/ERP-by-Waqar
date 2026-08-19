import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listLeaveTypes, createLeaveType } from "@/server/hr/leaves";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ leaveTypes: await listLeaveTypes() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createLeaveType({
      code: body.code,
      name: body.name,
      description: body.description ?? undefined,
      defaultTotal: body.defaultTotal ? Number(body.defaultTotal) : undefined,
      isPaid: typeof body.isPaid === "boolean" ? body.isPaid : undefined,
      requiresDocument: !!body.requiresDocument,
      color: body.color ?? undefined,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : undefined,
    });
    return ok({ leaveType: record });
  } catch (e) {
    return handleError(e);
  }
}
