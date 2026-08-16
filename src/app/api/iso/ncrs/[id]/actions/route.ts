import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { addCorrectiveAction } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.action) return fail("title and action are required");
  try {
    return ok(
      await addCorrectiveAction({
        ncrId: Number(id),
        type: body.type ?? "CORRECTIVE",
        title: body.title,
        rootCause: body.rootCause ?? null,
        action: body.action,
        responsibleId: body.responsibleId ? Number(body.responsibleId) : null,
        targetDate: body.targetDate ?? null,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
