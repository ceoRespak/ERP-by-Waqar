import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { assignProjectUser, removeProjectUser } from "@/server/projects/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await apiRequirePermission(PERMISSIONS.PROJECTS_UPDATE, Number(id));
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.role) return fail("userId and role are required");
  try {
    const assignment = await assignProjectUser({
      projectId: Number(id),
      userId: Number(body.userId),
      role: body.role as never,
    });
    return ok({ assignment });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await apiRequirePermission(PERMISSIONS.PROJECTS_UPDATE, Number(id));
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.userId) return fail("userId is required");
  try {
    await removeProjectUser(Number(id), Number(body.userId));
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
