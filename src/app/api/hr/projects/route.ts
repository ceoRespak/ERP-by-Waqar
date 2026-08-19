import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects, createProject } from "@/server/hr/projects";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  try {
    return ok({
      projects: await listProjects({
        status: searchParams.get("status") ?? undefined,
        type: searchParams.get("type") ?? undefined,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.startDate) return fail("name and startDate are required");
  try {
    const project = await createProject({
      name: body.name,
      code: body.code ?? undefined,
      description: body.description ?? null,
      locationAddress: body.locationAddress ?? null,
      locationCity: body.locationCity ?? null,
      locationProvince: body.locationProvince ?? null,
      locationLat: body.locationLat != null ? Number(body.locationLat) : null,
      locationLng: body.locationLng != null ? Number(body.locationLng) : null,
      projectType: body.projectType ?? "site",
      projectManagerId: body.projectManagerId ? Number(body.projectManagerId) : null,
      siteSupervisorId: body.siteSupervisorId ? Number(body.siteSupervisorId) : null,
      status: body.status ?? "planned",
      startDate: body.startDate,
      expectedEndDate: body.expectedEndDate ?? null,
      budget: body.budget ? Number(body.budget) : 0,
      allowedRadius: body.allowedRadius ? Number(body.allowedRadius) : 100,
      shiftType: body.shiftType ?? "morning",
      shiftStart: body.shiftStart ?? undefined,
      shiftEnd: body.shiftEnd ?? undefined,
      specialHours: body.specialHours ?? null,
      isApprovedSite: !!body.isApprovedSite,
      createdById: Number(user.id),
    });
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}
