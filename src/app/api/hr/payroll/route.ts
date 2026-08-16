import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPayrollRuns, createPayrollRun } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ runs: await listPayrollRuns() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.period || !body?.startDate || !body?.endDate) {
    return fail("period, startDate and endDate are required");
  }
  try {
    const record = await createPayrollRun({
      period: body.period,
      startDate: body.startDate,
      endDate: body.endDate,
      processedById: Number(user.id),
    });
    return ok({ run: record });
  } catch (e) {
    return handleError(e);
  }
}
