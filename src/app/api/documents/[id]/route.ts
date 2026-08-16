import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getDocumentDetail } from "@/server/documents/service";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    return ok({ document: await getDocumentDetail(Number(id)) });
  } catch (e) {
    return handleError(e);
  }
}
