import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listBoqs, createBoq } from "@/server/boq/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.BOQ_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    const boqs = await listBoqs(projectId ? { projectId: Number(projectId) } : {});
    return ok({ boqs });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.BOQ_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
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
