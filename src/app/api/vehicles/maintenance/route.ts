import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listMaintenances, createMaintenance } from "@/server/vehicles/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_READ);
  if (!user) return unauthorized();
  try {
    return ok({ maintenances: await listMaintenances() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.type || !body?.description || !body?.cost) {
    return fail("vehicleId, type, description and cost are required");
  }
  try {
    const record = await createMaintenance({
      vehicleId: Number(body.vehicleId),
      date: body.date ?? null,
      type: body.type,
      description: body.description,
      cost: Number(body.cost),
      vendorId: body.vendorId ? Number(body.vendorId) : null,
      nextDueKm: body.nextDueKm ? Number(body.nextDueKm) : null,
      status: body.status ?? "COMPLETED",
    });
    return ok({ maintenance: record });
  } catch (e) {
    return handleError(e);
  }
}
