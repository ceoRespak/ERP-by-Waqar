import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listTrips, createTrip } from "@/server/vehicles/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_READ);
  if (!user) return unauthorized();
  try {
    return ok({ trips: await listTrips() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.purpose) return fail("vehicleId and purpose are required");
  try {
    const record = await createTrip({
      vehicleId: Number(body.vehicleId),
      driverEmployeeId: body.driverEmployeeId ? Number(body.driverEmployeeId) : null,
      date: body.date ?? null,
      startKm: body.startKm ? Number(body.startKm) : null,
      endKm: body.endKm ? Number(body.endKm) : null,
      purpose: body.purpose,
      projectId: body.projectId ? Number(body.projectId) : null,
      notes: body.notes ?? null,
    });
    return ok({ trip: record });
  } catch (e) {
    return handleError(e);
  }
}
