import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCorrespondence, createCorrespondence } from "@/server/correspondence/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";
import type { CorrespondenceType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.CORRESPONDENCE_READ);
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const type = url.searchParams.get("type") ?? undefined;
  try {
    return ok({ items: await listCorrespondence({ projectId: projectId ? Number(projectId) : undefined, type }) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.CORRESPONDENCE_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.type || !body?.subject) return fail("type and subject are required");
  if (!["LETTER_IN", "LETTER_OUT", "INTERNAL_MEMO"].includes(body.type)) return fail("Invalid type");
  try {
    return ok(
      await createCorrespondence({
        projectId: body.projectId ? Number(body.projectId) : null,
        type: body.type as CorrespondenceType,
        date: body.date ?? null,
        fromName: body.fromName ?? null,
        toName: body.toName ?? null,
        subject: body.subject,
        body: body.body ?? null,
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
