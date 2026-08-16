import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVehicles, createVehicle } from "@/server/vehicles/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_READ);
  if (!user) return unauthorized();
  try {
    return ok({ vehicles: await listVehicles() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.VEHICLES_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.regNo || !body?.type) return fail("regNo and type are required");
  try {
    const record = await createVehicle({
      regNo: body.regNo,
      type: body.type,
      brand: body.brand ?? null,
      model: body.model ?? null,
      year: body.year ? Number(body.year) : null,
      capacity: body.capacity ?? null,
      fuelType: body.fuelType ?? "DIESEL",
      purchaseDate: body.purchaseDate ?? null,
      cost: body.cost ? Number(body.cost) : null,
      currentKm: body.currentKm ? Number(body.currentKm) : null,
      driverEmployeeId: body.driverEmployeeId ? Number(body.driverEmployeeId) : null,
      notes: body.notes ?? null,
    });
    return ok({ vehicle: record });
  } catch (e) {
    return handleError(e);
  }
}
