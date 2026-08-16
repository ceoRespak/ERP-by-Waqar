import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/permissions";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import { pendingApprovalsForUser, approveStep, rejectStep, approvalForEntity } from "@/server/approval/service";
import { ok, fail, forbidden, unauthorized, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";

/**
 * GET /api/approvals?scope=pending|mine|all&entityType=&entityId=
 * - scope=pending : approval requests waiting on the current user
 * - scope=all     : every approval request (admins)
 * - entityType+entityId : history for a single transaction
 */
export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "pending";
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  try {
    if (entityType && entityId) {
      const history = await approvalForEntity(entityType, Number(entityId));
      return ok(history ?? null);
    }

    if (scope === "all") {
      const hasBypass = user.roles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r));
      if (!hasBypass) return forbidden();
      const all = await prisma.approvalRequest.findMany({
        include: { chain: true, actions: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return ok({ requests: all, labels: ENTITY_TYPE_LABELS });
    }

    const requests = await pendingApprovalsForUser(Number(user.id), 100);
    return ok({ requests, labels: ENTITY_TYPE_LABELS });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/approvals
 * body: { action: "APPROVE" | "REJECT", requestId, comment }
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.requestId || !body?.action) return fail("requestId and action are required");
  if (!["APPROVE", "REJECT"].includes(body.action)) return fail("action must be APPROVE or REJECT");

  try {
    if (body.action === "APPROVE") {
      const updated = await approveStep({
        requestId: Number(body.requestId),
        userId: Number(user.id),
        userName: user.name ?? "User",
        comment: body.comment ?? "",
      });
      return ok({ request: updated });
    } else {
      const updated = await rejectStep({
        requestId: Number(body.requestId),
        userId: Number(user.id),
        userName: user.name ?? "User",
        comment: body.comment ?? "",
      });
      return ok({ request: updated });
    }
  } catch (e) {
    return handleError(e);
  }
}
