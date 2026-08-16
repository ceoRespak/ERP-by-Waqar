import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listSubmittals, createSubmittal } from "@/server/sites/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ submittals: await listSubmittals(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.title) return fail("projectId and title are required");
  try {
    const record = await createSubmittal({
      projectId: Number(body.projectId),
      date: body.date ?? null,
      title: body.title,
      category: body.category ?? null,
      description: body.description ?? null,
    });
    return ok({ submittal: record });
  } catch (e) {
    return handleError(e);
  }
}
