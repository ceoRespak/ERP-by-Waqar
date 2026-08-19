import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createNotification } from "@/server/hr/notifications";

// =====================================================================
// HR CIRCULARS — faithful port of respakHRM circularController.js
// =====================================================================

export async function listCirculars(userRole?: string | null) {
  return prisma.circular.findMany({
    where: userRole ? { isActive: true } : { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } }, readBy: true },
  });
}

export async function createCircular(data: {
  title: string;
  message: string;
  attachment?: string | null;
  attachmentName?: string | null;
  targetRoles?: string[] | null;
  priority?: string;
  createdById: number;
}) {
  const record = await prisma.circular.create({
    data: {
      title: data.title,
      message: data.message,
      attachment: data.attachment ?? null,
      attachmentName: data.attachmentName ?? null,
      targetRoles: data.targetRoles?.length ? (data.targetRoles as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      priority: data.priority ?? "normal",
      createdById: data.createdById,
    },
  });

  // Notify users whose roles are targeted (or everyone if none specified)
  const target = data.targetRoles?.length ? data.targetRoles : ["admin", "hr_manager", "project_manager", "employee"];
  const roleNames = target.map((r) => {
    if (r === "admin") return "ADMIN";
    if (r === "hr_manager") return "HR_MANAGER";
    if (r === "project_manager") return "PROJECT_MANAGER";
    return "EMPLOYEE";
  });
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", roles: { some: { role: { name: { in: roleNames } } } } },
    select: { id: true },
  });
  for (const u of users) {
    await createNotification({
      recipientId: u.id,
      senderId: data.createdById,
      type: "circular",
      title: data.title,
      message: data.message,
      relatedModel: "Circular",
      relatedId: record.id,
      priority: data.priority ?? "normal",
    });
  }
  return record;
}

export async function getCircular(id: number, userId: number) {
  // Mark as read for this user (respakHRM viewCircular)
  const circular = await prisma.circular.findUnique({ where: { id }, include: { createdBy: { select: { id: true, name: true } }, readBy: true } });
  if (!circular) throw new Error("Circular not found.");
  await prisma.circularRead.upsert({
    where: { circularId_userId: { circularId: id, userId } },
    update: {},
    create: { circularId: id, userId },
  });
  return circular;
}

export async function deleteCircular(id: number) {
  await prisma.circular.delete({ where: { id } });
  return { ok: true };
}

export async function unreadCircularCount(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
  const roleNames = user?.roles.map((r) => r.role.name) ?? [];
  const circulars = await prisma.circular.findMany({
    where: { isActive: true },
    select: { id: true, targetRoles: true },
  });
  let unread = 0;
  for (const c of circulars) {
    const targets = (c.targetRoles as string[] | null) ?? null;
    const read = await prisma.circularRead.findUnique({ where: { circularId_userId: { circularId: c.id, userId } } });
    if (read) continue;
    if (!targets) { unread++; continue; }
    const mapped = targets.map((r) => (r === "admin" ? "ADMIN" : r === "hr_manager" ? "HR_MANAGER" : r === "project_manager" ? "PROJECT_MANAGER" : "EMPLOYEE"));
    if (mapped.some((m) => roleNames.includes(m))) unread++;
  }
  return unread;
}
