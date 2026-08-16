import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listTransmittals, createTransmittal } from "@/server/sites/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ transmittals: await listTransmittals(projectId ? { projectId: Number(projectId) } : {}) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.SITES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.subject) return fail("projectId and subject are required");
  try {
    const record = await createTransmittal({
      projectId: Number(body.projectId),
      date: body.date ?? null,
      subject: body.subject,
      receiverName: body.receiverName ?? null,
      receiverOrg: body.receiverOrg ?? null,
      description: body.description ?? null,
      status: body.status ?? "SENT",
    });
    return ok({ transmittal: record });
  } catch (e) {
    return handleError(e);
  }
}
