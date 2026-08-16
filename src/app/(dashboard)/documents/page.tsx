import Link from "next/link";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { listDocuments, listDocumentCategories, documentExpiryAlerts } from "@/server/documents/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DocumentForm } from "@/components/documents/document-form";
import { CategoryForm } from "@/components/documents/category-form";
import { formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ module?: string }> };

export default async function DocumentsPage({ searchParams }: Props) {
  const { module } = await searchParams;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.DOCUMENTS_READ);

  const [categories, documents, alerts] = await Promise.all([
    listDocumentCategories(),
    listDocuments({ module: module || undefined }),
    documentExpiryAlerts(45),
  ]);

  const modules = ["ALL", "QUALITY", "ENVIRONMENT", "SAFETY", "HR", "PROCUREMENT", "GENERAL"];
  const nextCode = `RES/QMS/${String(documents.length + 1).padStart(3, "0")}`;

  const columns: Column<(typeof documents)[number]>[] = [
    {
      key: "docCode",
      header: "Code",
      render: (r) => (
        <Link href={`/documents/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
          {r.docCode}
        </Link>
      ),
    },
    { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "category", header: "Category", render: (r) => (r.category ? `${r.category.code} · ${r.category.name}` : "—") },
    { key: "module", header: "Module", render: (r) => <Badge variant="secondary">{r.module}</Badge> },
    { key: "isoStandard", header: "ISO", render: (r) => (r.isoStandard !== "NONE" ? <Badge>{r.isoStandard}</Badge> : "—") },
    { key: "currentVersion", header: "Ver", className: "text-right", render: (r) => r.currentVersion },
    {
      key: "expiryDate",
      header: "Expiry",
      render: (r) => {
        if (!r.expiryDate) return "—";
        const days = Math.ceil((r.expiryDate.getTime() - Date.now()) / 86400000);
        return (
          <span className={days <= 30 ? "font-medium text-destructive" : ""}>
            {formatDate(r.expiryDate)}
            {days <= 30 ? " ⚠" : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Document Control" description="ISO-compliant controlled documents with version history and expiry alerts." />

      <div className="flex flex-wrap gap-2">
        {modules.map((m) => {
          const active = (module ?? "ALL") === m;
          const href = m === "ALL" ? "/documents" : `/documents?module=${m}`;
          return (
            <Link
              key={m}
              href={href}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {m}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expiry Alerts (next 45 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <p className="py-2 text-sm text-muted-foreground">No documents expiring soon.</p>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
              <div>
                <Link href={`/documents/${a.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                  {a.docCode}
                </Link>
                <span className="ml-2">{a.title}</span>
              </div>
              <span className="font-medium text-destructive">{formatDate(a.expiryDate)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} rows={documents} rowKey={(r) => r.id} emptyMessage="No documents yet." />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <DocumentForm projectId={null} categories={categories} nextCode={nextCode} />
          <CategoryForm />
        </div>
      </div>
    </div>
  );
}
