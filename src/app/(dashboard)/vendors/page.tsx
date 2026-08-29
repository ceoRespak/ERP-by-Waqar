import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listVendors } from "@/server/vendors/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { VendorForm } from "@/components/vendors/vendor-form";

type Row = Awaited<ReturnType<typeof listVendors>>[number];

const columns: Column<Row>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-medium">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type.replace("_", " ")}</Badge> },
  { key: "contactPerson", header: "Contact" },
  { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
  {
    key: "payableAccount",
    header: "Payable Account",
    render: (r) =>
      r.payableAccount ? (
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-xs text-slate-500">{r.payableAccount.code}</span>
          <span>{r.payableAccount.name}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  { key: "rating", header: "Rating", className: "text-right", render: (r) => (r.rating ? r.rating.toString() : "—") },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function VendorsPage() {
  await requirePermission(PERMISSIONS.VENDORS_READ);
  const vendors = await listVendors();

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="Suppliers, contractors and service providers." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={vendors} rowKey={(r) => r.id} emptyMessage="No vendors yet." />
        </div>
        <VendorForm />
      </div>
    </div>
  );
}
