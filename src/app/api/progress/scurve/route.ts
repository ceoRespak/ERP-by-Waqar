import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjectProgress } from "@/server/progress/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROGRESS_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return fail("projectId is required");
  try {
    const points = await listProjectProgress(Number(projectId));
    return ok({ points });
  } catch (e) {
    return handleError(e);
  }
}
