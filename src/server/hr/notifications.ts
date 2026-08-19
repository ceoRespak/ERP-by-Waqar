import { prisma } from "@/lib/db";

// =====================================================================
// HR NOTIFICATIONS — ported from respakHRM Notification model + controller
// =====================================================================

export async function createNotification(data: {
  recipientId: number;
  senderId?: number | null;
  type: string;
  title: string;
  message: string;
  relatedModel?: string | null;
  relatedId?: number | null;
  priority?: string;
}) {
  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      senderId: data.senderId ?? null,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedModel: data.relatedModel ?? null,
      relatedId: data.relatedId ?? null,
      priority: data.priority ?? "normal",
    },
  });
}

/** Notify every active user holding one of the given role names. */
export async function notifyUsersByRole(roleNames: string[], payload: Omit<Parameters<typeof createNotification>[0], "recipientId">) {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", roles: { some: { role: { name: { in: roleNames } } } } },
    select: { id: true },
  });
  for (const u of users) {
    await createNotification({ ...payload, recipientId: u.id });
  }
}

export async function listNotifications(userId: number, page = 1, pageSize = 20) {
  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);
  return { notifications, total, unread, page, pageSize };
}

export async function markNotificationRead(id: number, userId: number) {
  return prisma.notification.updateMany({
    where: { id, recipientId: userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: number) {
  return prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function unreadNotificationCount(userId: number) {
  return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
}
