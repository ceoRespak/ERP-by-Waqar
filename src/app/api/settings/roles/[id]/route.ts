import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    const role = await prisma.role.update({
      where: { id: Number(id) },
      data: {
        ...(body?.name ? { name: body.name.toUpperCase().trim() } : {}),
        ...(typeof body?.description === "string" ? { description: body.description } : {}),
      },
    });
    return ok({ role });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const role = await prisma.role.findUnique({ where: { id: Number(id) } });
    if (!role) return fail("Role not found", 404);
    if (role.isSystem) return fail("System roles (e.g. SUPER_ADMIN) cannot be deleted.");
    await prisma.role.delete({ where: { id: Number(id) } });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
