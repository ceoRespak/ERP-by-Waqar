import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listFaceEnrollments, createFaceEnrollment, approveFaceEnrollment, rejectFaceEnrollment, unlinkFaceEnrollment } from "@/server/hr/devices";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ faceEnrollments: await listFaceEnrollments() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (body?.action === "approve" && body?.id) {
    try {
      return ok({ faceEnrollment: await approveFaceEnrollment(Number(body.id), Number(user.id)) });
    } catch (e) {
      return handleError(e);
    }
  }
  if (body?.action === "reject" && body?.id) {
    try {
      return ok({ faceEnrollment: await rejectFaceEnrollment(Number(body.id), Number(user.id)) });
    } catch (e) {
      return handleError(e);
    }
  }
  if (body?.action === "unlink" && body?.employeeId) {
    try {
      return ok(await unlinkFaceEnrollment(Number(body.employeeId)));
    } catch (e) {
      return handleError(e);
    }
  }
  if (!body?.employeeId || !body?.descriptor) return fail("employeeId and descriptor are required");
  try {
    const record = await createFaceEnrollment(Number(body.employeeId), Number(user.id), body.descriptor, body.photo ?? null);
    return ok({ faceEnrollment: record });
  } catch (e) {
    return handleError(e);
  }
}
