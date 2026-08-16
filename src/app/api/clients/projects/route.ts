import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects, createProject } from "@/server/clients/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ projects: await listProjects() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createProject({
      code: body.code,
      name: body.name,
      clientId: body.clientId ? Number(body.clientId) : null,
      location: body.location ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      budget: body.budget ? Number(body.budget) : 0,
      status: body.status ?? "PLANNING",
      managerEmployeeId: body.managerEmployeeId ? Number(body.managerEmployeeId) : null,
      description: body.description ?? null,
    });
    return ok({ project: record });
  } catch (e) {
    return handleError(e);
  }
}
