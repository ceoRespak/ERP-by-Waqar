import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendorDocuments } from "@/server/vendors/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DocumentForm } from "@/components/vendors/document-form";
import { formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listVendorDocuments>>[number];

const columns: Column<Row>[] = [
  { key: "vendor", header: "Vendor", render: (r) => r.vendor.name },
  { key: "name", header: "Document" },
  { key: "type", header: "Type", render: (r) => (r.type ? <Badge variant="secondary">{r.type}</Badge> : "—") },
  { key: "expiryDate", header: "Expiry", render: (r) =>
    r.expiryDate ? (
      <span className={r.expiryDate < new Date() ? "font-medium text-destructive" : undefined}>
        {formatDate(r.expiryDate)}
      </span>
    ) : "—",
  },
  { key: "fileUrl", header: "", render: (r) => (
    <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      Open
    </a>
  ) },
];

export default async function DocumentsPage() {
  await requirePermission(PERMISSIONS.VENDORS_READ);
  const [documents, vendors] = await Promise.all([
    listVendorDocuments(),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Documents" description="NTN, registration and bank documents per vendor." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={documents} rowKey={(r) => r.id} emptyMessage="No documents yet." />
        </div>
        <DocumentForm vendors={vendors} />
      </div>
    </div>
  );
}
