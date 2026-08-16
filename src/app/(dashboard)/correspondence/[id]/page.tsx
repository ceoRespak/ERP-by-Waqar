import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getCorrespondenceDetail } from "@/server/correspondence/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { CorrespondenceStatus } from "@/components/correspondence/status-control";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function CorrespondenceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.CORRESPONDENCE_READ);
  const item = await getCorrespondenceDetail(Number(id));
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={item.refNo} description={item.subject} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{item.type.replace("_", " ")}</Badge>
          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          <CorrespondenceStatus id={item.id} status={item.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-lg font-semibold">{item.subject}</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {item.body ?? "No body content."}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{item.type.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(item.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">From</span><span>{item.fromName ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">To</span><span>{item.toName ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{item.project?.code ?? "—"}</span></div>
            </CardContent>
          </Card>
          <Link href="/correspondence" className="inline-block text-sm text-primary hover:underline">
            ← Back to Correspondence
          </Link>
        </div>
      </div>
    </div>
  );
}
