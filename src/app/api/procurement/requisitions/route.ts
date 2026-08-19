import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listRequisitions, createRequisition } from "@/server/procurement/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_READ);
  if (!user) return unauthorized();
  try {
    const data = await listRequisitions();
    return ok({ requisitions: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.PROCUREMENT_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();

  if (!body?.title || !body?.items?.length) return fail("title and at least one item are required");

  try {
    const record = await createRequisition({
      title: body.title,
      requestedById: Number(user.id),
      requestedByName: user.name ?? "User",
      departmentId: body.departmentId ? Number(body.departmentId) : null,
      projectId: body.projectId ? Number(body.projectId) : null,
      requiredDate: body.requiredDate ?? null,
      notes: body.notes ?? null,
      items: body.items,
    });
    return ok({ requisition: record });
  } catch (e) {
    return handleError(e);
  }
}
