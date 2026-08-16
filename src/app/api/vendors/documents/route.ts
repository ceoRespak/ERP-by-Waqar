import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendorDocuments, createVendorDocument } from "@/server/vendors/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_READ);
  if (!user) return unauthorized();
  const vendorId = new URL(req.url).searchParams.get("vendorId");
  try {
    return ok({ documents: await listVendorDocuments(vendorId ? Number(vendorId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VENDORS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.vendorId || !body?.name || !body?.fileUrl) return fail("vendorId, name and fileUrl are required");
  try {
    const record = await createVendorDocument({
      vendorId: Number(body.vendorId),
      name: body.name,
      type: body.type ?? null,
      fileUrl: body.fileUrl,
      expiryDate: body.expiryDate ?? null,
    });
    return ok({ document: record });
  } catch (e) {
    return handleError(e);
  }
}
