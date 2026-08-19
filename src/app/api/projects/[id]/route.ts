import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getProjectDetail } from "@/server/projects/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await apiRequirePermission(PERMISSIONS.PROJECTS_READ, Number(id));
  if (!user) return unauthorized();
  try {
    const detail = await getProjectDetail(Number(id));
    if (!detail) return ok({ error: "Project not found" }, { status: 404 });
    return ok(detail);
  } catch (e) {
    return handleError(e);
  }
}
