import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendors, createVendor } from "@/server/vendors/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ vendors: await listVendors() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createVendor({
      code: body.code,
      name: body.name,
      type: body.type ?? "SUPPLIER",
      contactPerson: body.contactPerson ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      ntn: body.ntn ?? null,
      bankName: body.bankName ?? null,
      bankAccount: body.bankAccount ?? null,
      notes: body.notes ?? null,
      payableAccountId: body.payableAccountId ? Number(body.payableAccountId) : null,
    });
    return ok({ vendor: record });
  } catch (e) {
    return handleError(e);
  }
}
