import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDocuments, createDocument } from "@/server/documents/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";
import type { IsoStandard } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_READ);
  if (!user) return unauthorized();
  const docModule = new URL(req.url).searchParams.get("module") ?? undefined;
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    return ok({ documents: await listDocuments({ module: docModule, projectId: projectId ? Number(projectId) : undefined }) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.docCode || !body?.title || !body?.module) return fail("docCode, title and module are required");
  try {
    const record = await createDocument({
      docCode: body.docCode,
      title: body.title,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      module: body.module,
      isoStandard: (body.isoStandard ?? "NONE") as IsoStandard,
      description: body.description ?? null,
      effectiveDate: body.effectiveDate ?? null,
      expiryDate: body.expiryDate ?? null,
      ownerUserId: body.ownerUserId ? Number(body.ownerUserId) : Number(user.id),
      projectId: body.projectId ? Number(body.projectId) : null,
    });
    return ok({ document: record });
  } catch (e) {
    return handleError(e);
  }
}
