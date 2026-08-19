import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getCircular } from "@/server/hr/circulars";
import { auth } from "@/lib/auth";
import type { AuthUser } from "@/lib/permissions";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function CircularDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission(PERMISSIONS.HR_READ);
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  const userId = Number(user?.id ?? 0);
  let circular;
  try {
    circular = await getCircular(Number(id), userId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={circular.title} description={`by ${circular.createdBy.name} · ${formatDate(circular.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Badge variant={statusVariant(circular.priority)}>{circular.priority}</Badge>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{circular.message}</p>
              {circular.attachment && (
                <p className="text-sm text-muted-foreground">Attachment: {circular.attachmentName ?? circular.attachment}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Read Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {circular.readBy.length === 0 && <p className="text-muted-foreground">No one has read this yet.</p>}
              {circular.readBy.slice(0, 20).map((r) => (
                <div key={r.id} className="flex justify-between border-b py-1 text-xs">
                  <span>User #{r.userId}</span>
                  <span className="text-muted-foreground">{formatDate(r.readAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Link href="/hr/circulars" className="inline-block text-sm text-primary hover:underline">← Back to Circulars</Link>
        </div>
      </div>
    </div>
  );
}
