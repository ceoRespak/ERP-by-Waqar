import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listBoqs, createBoq } from "@/server/boq/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BOQ_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    const boqs = await listBoqs(projectId ? { projectId: Number(projectId) } : {});
    return ok({ boqs });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.BOQ_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.title) return fail("projectId and title are required");
  try {
    const record = await createBoq({
      projectId: Number(body.projectId),
      title: body.title,
      version: body.version ?? "1.0",
    });
    return ok({ boq: record });
  } catch (e) {
    return handleError(e);
  }
}
