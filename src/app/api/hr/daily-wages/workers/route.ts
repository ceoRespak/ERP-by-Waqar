import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDailyWageWorkers, createDailyWageWorker, updateDailyWageWorker, deleteDailyWageWorker } from "@/server/hr/attendance";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  try {
    return ok({ workers: await listDailyWageWorkers({ projectId: searchParams.get("projectId") ? Number(searchParams.get("projectId")) : undefined }) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (body?.action === "update" && body?.id) {
    try {
      const worker = await updateDailyWageWorker(Number(body.id), {
        name: body.name,
        fatherName: body.fatherName ?? null,
        phone: body.phone ?? null,
        dailyWageAmount: body.dailyWageAmount ? Number(body.dailyWageAmount) : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      });
      return ok({ worker });
    } catch (e) {
      return handleError(e);
    }
  }
  if (body?.action === "delete" && body?.id) {
    try {
      await deleteDailyWageWorker(Number(body.id));
      return ok({ ok: true });
    } catch (e) {
      return handleError(e);
    }
  }
  if (!body?.cnic || !body?.name || !body?.projectId) return fail("cnic, name and projectId are required");
  try {
    const worker = await createDailyWageWorker({
      cnic: body.cnic,
      name: body.name,
      fatherName: body.fatherName ?? null,
      phone: body.phone ?? null,
      projectId: Number(body.projectId),
      dailyWageAmount: body.dailyWageAmount ? Number(body.dailyWageAmount) : 0,
    });
    return ok({ worker });
  } catch (e) {
    return handleError(e);
  }
}
