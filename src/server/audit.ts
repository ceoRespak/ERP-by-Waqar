import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Write an audit log entry. Never throws — auditing must not break business flow.
 */
export async function auditLog(
  data: {
    userId?: number | null;
    userName?: string | null;
    action: string;
    module: string;
    entity?: string;
    entityId?: string | number;
    details?: Prisma.InputJsonValue;
    ip?: string;
  }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        userName: data.userName ?? null,
        action: data.action,
        module: data.module,
        entity: data.entity,
        entityId: data.entityId != null ? String(data.entityId) : null,
        details: data.details ?? undefined,
        ip: data.ip,
      },
    });
  } catch {
    // ignore audit failures
  }
}
