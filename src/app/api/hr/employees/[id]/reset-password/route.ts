import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { resetEmployeePassword } from "@/server/hr/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  try {
    const result = await resetEmployeePassword(Number(id), body?.password ?? undefined);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
