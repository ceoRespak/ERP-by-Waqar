import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listApprovalChains, createApprovalChain, listRoles } from "@/server/settings/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ chains: await listApprovalChains(), roles: await listRoles() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SETTINGS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.module || !body?.entityType || !body?.steps?.length) {
    return fail("name, module, entityType and steps are required");
  }
  try {
    const record = await createApprovalChain({
      name: body.name,
      module: body.module,
      entityType: body.entityType,
      description: body.description ?? null,
      steps: body.steps,
    });
    return ok({ chain: record });
  } catch (e) {
    return handleError(e);
  }
}
