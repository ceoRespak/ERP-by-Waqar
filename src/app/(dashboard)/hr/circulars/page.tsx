import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listCirculars } from "@/server/hr/circulars";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { CircularForm } from "@/components/hr/circular-form";
import { formatDate } from "@/lib/utils";

export default async function CircularsPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const circulars = await listCirculars();

  return (
    <div className="space-y-6">
      <PageHeader title="Circulars" description="Role-targeted announcements with read tracking." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {circulars.length === 0 && (
            <Card><CardContent className="p-10 text-center text-muted-foreground">No circulars yet.</CardContent></Card>
          )}
          {circulars.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/hr/circulars/${c.id}`} className="font-semibold hover:underline">{c.title}</Link>
                    <p className="text-xs text-muted-foreground">by {c.createdBy.name} · {formatDate(c.createdAt)}</p>
                  </div>
                  <Badge variant={statusVariant(c.priority)}>{c.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Target: {(c.targetRoles as string[] | null)?.join(", ") ?? "All roles"}</span>
                  <span>· {c.readBy.length} read</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <CircularForm />
      </div>
    </div>
  );
}
