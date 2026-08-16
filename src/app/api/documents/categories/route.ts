import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listDocumentCategories, createDocumentCategory } from "@/server/documents/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_READ);
  if (!user) return unauthorized();
  try {
    return ok({ categories: await listDocumentCategories() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) return fail("code and name are required");
  try {
    return ok({
      category: await createDocumentCategory({
        code: body.code,
        name: body.name,
        type: body.type ?? "DOCUMENT",
        module: body.module ?? "QUALITY",
        description: body.description ?? null,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}
