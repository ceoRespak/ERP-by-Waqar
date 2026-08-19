import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/permissions";
import { approveStep, rejectStep } from "@/server/approval/service";
import { ok, unauthorized, handleError } from "@/lib/api";

/**
 * Generic approval action endpoint: approve / forward / reject.
 * - "approve" / "forward"  → advance one step (final step approves the item)
 * - "reject"               → stop the flow
 * Authorization: existing chain step role/user OR the dynamic
 * `<module>:approve` permission (Super Admin bypasses all checks).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action ?? "approve";
  try {
    const base = { requestId: Number(id), userId: Number(user.id), userName: user.name ?? "User", comment: body?.comment ?? null };
    if (action === "reject") {
      return ok({ request: await rejectStep(base) });
    }
    return ok({ request: await approveStep(base) });
  } catch (e) {
    return handleError(e);
  }
}
