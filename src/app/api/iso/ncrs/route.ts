import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listNcrs, createNcr } from "@/server/iso/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const user = await apiRequirePermission(PERMISSIONS.ISO_READ, projectId ? Number(projectId) : null);
  if (!user) return unauthorized();
  try {
    return ok({ ncrs: await listNcrs(projectId ? Number(projectId) : undefined) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.ISO_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
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
