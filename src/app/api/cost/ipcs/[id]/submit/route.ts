import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { submitIpc } from "@/server/cost/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.COST_APPROVE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    return ok(await submitIpc({ id: Number(id), userId: Number(user.id), userName: user.name ?? "User" }));
  } catch (e) {
    return handleError(e);
  }
}
