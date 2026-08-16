import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getDocumentDetail } from "@/server/documents/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DocStatusControl } from "@/components/documents/status-control";
import { VersionForm } from "@/components/documents/version-form";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.DOCUMENTS_READ);
  const doc = await getDocumentDetail(Number(id));
  if (!doc) notFound();

  const versions = doc.versions;
  const nextMajor = doc.currentVersion ? Number(doc.currentVersion.split(".")[0]) + 1 : 2;
  const nextVersion = `${nextMajor}.0`;

  const columns: Column<(typeof versions)[number]>[] = [
    { key: "versionNo", header: "Version", render: (r) => <span className="font-mono text-sm font-medium">{r.versionNo}</span> },
    { key: "fileName", header: "File" },
    {
      key: "fileUrl",
      header: "URL",
      render: (r) => (
        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          open ↗
        </a>
      ),
    },
    { key: "changeSummary", header: "Change Summary", render: (r) => r.changeSummary ?? "—" },
    { key: "uploadedBy", header: "Uploaded By", render: (r) => r.uploadedBy?.name ?? "—" },
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={doc.docCode} description={doc.title} />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(doc.status)}>{doc.status.replace("_", " ")}</Badge>
          <DocStatusControl documentId={doc.id} status={doc.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} rows={versions} rowKey={(r) => r.id} emptyMessage="No versions yet — upload the first one." />
            </CardContent>
          </Card>

          <div className="mt-6">
            <VersionForm documentId={doc.id} nextVersion={nextVersion} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{doc.category ? `${doc.category.code} · ${doc.category.name}` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Module</span><span>{doc.module}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ISO Standard</span><span>{doc.isoStandard}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current Version</span><span className="font-medium">{doc.currentVersion}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Effective</span><span>{doc.effectiveDate ? formatDate(doc.effectiveDate) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span>{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span>{doc.owner?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{doc.project?.code ?? "—"}</span></div>
              {doc.description && <p className="border-t pt-2 text-muted-foreground">{doc.description}</p>}
            </CardContent>
          </Card>
          <Link href="/documents" className="inline-block text-sm text-primary hover:underline">
            ← Back to Document Control
          </Link>
        </div>
      </div>
    </div>
  );
}
