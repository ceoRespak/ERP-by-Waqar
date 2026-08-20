import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deleteProjectAttachment } from "@/server/projects/attachments";
import { deleteUploaded } from "@/lib/upload";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await prisma.projectAttachment.findUnique({
    where: { id: Number(id) },
    select: { id: true, projectId: true, fileUrl: true },
  });
  if (!attachment) return fail("Attachment not found.", 404);

  const user = await apiRequirePermission(PERMISSIONS.DOCUMENTS_DELETE, attachment.projectId);
  if (!user) return unauthorized();

  try {
    await deleteProjectAttachment(attachment.id);
    await deleteUploaded(attachment.fileUrl);
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
