import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendorEvaluations, createVendorEvaluation } from "@/server/vendors/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_READ);
  if (!user) return unauthorized();
  const vendorId = new URL(req.url).searchParams.get("vendorId");
  try {
    return ok({ evaluations: await listVendorEvaluations(vendorId ? Number(vendorId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.vendorId || !body?.criteria || !body?.score) return fail("vendorId, criteria and score are required");
  try {
    const record = await createVendorEvaluation({
      vendorId: Number(body.vendorId),
      date: body.date ?? null,
      criteria: body.criteria,
      score: Number(body.score),
      remarks: body.remarks ?? null,
      evaluatedBy: user.name ?? null,
    });
    return ok({ evaluation: record });
  } catch (e) {
    return handleError(e);
  }
}
