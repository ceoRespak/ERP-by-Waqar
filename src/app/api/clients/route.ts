import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listClients, createClient } from "@/server/clients/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ clients: await listClients() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.CLIENTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    const record = await createClient({
      code: body.code,
      name: body.name,
      type: body.type ?? "CORPORATE",
      contactPerson: body.contactPerson ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      ntn: body.ntn ?? null,
    });
    return ok({ client: record });
  } catch (e) {
    return handleError(e);
  }
}
