import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listTraining, createTraining } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ);
  if (!user) return unauthorized();
  try {
    return ok({ training: await listTraining() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.trainingTitle) return fail("trainingTitle is required");
  try {
    return ok(
      await createTraining({
        employeeId: body.employeeId ? Number(body.employeeId) : null,
        trainingTitle: body.trainingTitle,
        provider: body.provider ?? null,
        trainingDate: body.trainingDate ?? null,
        expiryDate: body.expiryDate ?? null,
        certificateUrl: body.certificateUrl ?? null,
        competencyLevel: body.competencyLevel ?? "BASIC",
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
