import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listNcrs, createNcr } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ);
  if (!user) return unauthorized();
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ ncrs: await listNcrs(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.description) return fail("description is required");
  try {
    return ok(
      await createNcr({
        projectId: body.projectId ? Number(body.projectId) : null,
        date: body.date ?? null,
        source: body.source ?? null,
        description: body.description,
        severity: body.severity ?? "MINOR",
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
