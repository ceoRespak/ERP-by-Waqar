import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listNotifications } from "@/server/hr/notifications";
import { auth } from "@/lib/auth";
import type { AuthUser } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { MarkAllReadButton } from "@/components/hr/mark-all-read";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;
  const { notifications, unread, total } = await listNotifications(Number(user.id), 1, 50);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${unread} unread of ${total} total.`}>
        <MarkAllReadButton />
      </PageHeader>
      <Card>
        <CardContent className="space-y-2 p-4">
          {notifications.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start justify-between gap-3 rounded-md border p-3 ${n.isRead ? "opacity-60" : ""}`}>
              <div>
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <span className="text-sm font-medium">{n.title}</span>
                  <Badge variant={statusVariant(n.priority)} className="text-[10px]">{n.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
