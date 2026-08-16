import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects, createProject } from "@/server/projects/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROJECTS_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  try {
    const projects = await listProjects({
      category: category as never,
      status: status as never,
      limit: 300,
    });
    return ok({ projects });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.PROJECTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createProject({
      code: body.code,
      name: body.name,
      category: body.category ?? "CONSTRUCTION",
      clientId: body.clientId ? Number(body.clientId) : null,
      location: body.location ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      budget: body.budget ? Number(body.budget) : 0,
      status: body.status ?? "PLANNING",
      managerEmployeeId: body.managerEmployeeId ? Number(body.managerEmployeeId) : null,
      description: body.description ?? null,
      projectUsers: body.projectUsers?.length
        ? body.projectUsers.map((u: { userId: string | number; role: string }) => ({
            userId: Number(u.userId),
            role: u.role as never,
          }))
        : undefined,
    });
    return ok({ project: record });
  } catch (e) {
    return handleError(e);
  }
}
