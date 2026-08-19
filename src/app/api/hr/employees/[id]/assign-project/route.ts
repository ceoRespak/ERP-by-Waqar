import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { assignProject } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.projectId) return fail("projectId is required");
  try {
    const project = await assignProject(Number(id), Number(body.projectId), body.role ?? null, Number(user.id));
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}
