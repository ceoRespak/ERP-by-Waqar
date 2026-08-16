import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listContracts, createContract } from "@/server/clients/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ contracts: await listContracts() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.clientId || !body?.contractNo || !body?.title || !body?.value || !body?.startDate) {
    return fail("clientId, contractNo, title, value and startDate are required");
  }
  try {
    const record = await createContract({
      clientId: Number(body.clientId),
      projectId: body.projectId ? Number(body.projectId) : null,
      contractNo: body.contractNo,
      title: body.title,
      value: Number(body.value),
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      status: body.status ?? "ACTIVE",
    });
    return ok({ contract: record });
  } catch (e) {
    return handleError(e);
  }
}
