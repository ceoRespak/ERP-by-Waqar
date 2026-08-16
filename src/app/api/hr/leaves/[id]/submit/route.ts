import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { submitLeaveRequest } from "@/server/hr/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    return ok(await submitLeaveRequest({ id: Number(id), userId: Number(user.id), userName: user.name ?? "User" }));
  } catch (e) {
    return handleError(e);
  }
}
