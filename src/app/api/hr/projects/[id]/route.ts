import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getProject, updateProject, deleteProject } from "@/server/hr/projects";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const project = await getProject(Number(id));
    if (!project) return fail("Project not found", 404);
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    const project = await updateProject(Number(id), {
      name: body?.name,
      description: body?.description ?? null,
      locationAddress: body?.locationAddress ?? null,
      locationCity: body?.locationCity ?? null,
      locationProvince: body?.locationProvince ?? null,
      locationLat: body?.locationLat != null ? Number(body.locationLat) : null,
      locationLng: body?.locationLng != null ? Number(body.locationLng) : null,
      projectType: body?.projectType,
      projectManagerId: body?.projectManagerId ? Number(body.projectManagerId) : null,
      siteSupervisorId: body?.siteSupervisorId ? Number(body.siteSupervisorId) : null,
      status: body?.status,
      startDate: body?.startDate,
      expectedEndDate: body?.expectedEndDate ?? null,
      budget: body?.budget != null ? Number(body.budget) : undefined,
      allowedRadius: body?.allowedRadius != null ? Number(body.allowedRadius) : undefined,
      shiftType: body?.shiftType,
      shiftStart: body?.shiftStart,
      shiftEnd: body?.shiftEnd,
      specialHours: body?.specialHours ?? null,
      isApprovedSite: body?.isApprovedSite,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
    });
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteProject(Number(id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
