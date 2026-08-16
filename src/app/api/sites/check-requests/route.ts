import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCheckRequests, createCheckRequest } from "@/server/sites/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ checkRequests: await listCheckRequests(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.amount || !body?.payeeName || !body?.description) {
    return fail("projectId, amount, payeeName and description are required");
  }
  try {
    const record = await createCheckRequest({
      projectId: Number(body.projectId),
      date: body.date ?? null,
      amount: Number(body.amount),
      payeeName: body.payeeName,
      payeeType: body.payeeType ?? "OTHER",
      description: body.description,
    });
    return ok({ checkRequest: record });
  } catch (e) {
    return handleError(e);
  }
}
