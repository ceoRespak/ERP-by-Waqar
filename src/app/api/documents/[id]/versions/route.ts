import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { addDocumentVersion } from "@/server/documents/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.versionNo || !body?.fileName || !body?.fileUrl) return fail("versionNo, fileName and fileUrl are required");
  try {
    return ok(
      await addDocumentVersion({
        documentId: Number(id),
        versionNo: body.versionNo,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        changeSummary: body.changeSummary ?? null,
        uploadedById: Number(user.id),
      })
    );
  } catch (e) {
    return handleError(e);
  }
}
