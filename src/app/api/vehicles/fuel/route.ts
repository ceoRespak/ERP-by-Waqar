import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listFuelLogs, createFuelLog } from "@/server/vehicles/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_READ);
  if (!user) return unauthorized();
  try {
    return ok({ fuelLogs: await listFuelLogs() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.liters || !body?.rate) return fail("vehicleId, liters and rate are required");
  try {
    const record = await createFuelLog({
      vehicleId: Number(body.vehicleId),
      date: body.date ?? null,
      odometer: body.odometer ? Number(body.odometer) : null,
      liters: Number(body.liters),
      rate: Number(body.rate),
      vendorId: body.vendorId ? Number(body.vendorId) : null,
      notes: body.notes ?? null,
    });
    return ok({ fuelLog: record });
  } catch (e) {
    return handleError(e);
  }
}
