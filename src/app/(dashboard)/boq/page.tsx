import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listBoqs } from "@/server/boq/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listBoqs>>[number];

const columns: Column<Row>[] = [
  {
    key: "code",
    header: "BOQ",
    render: (r) => (
      <Link href={`/boq/${r.id}`} className="font-medium text-primary hover:underline">{r.code}</Link>
    ),
  },
  { key: "title", header: "Title" },
  { key: "project", header: "Project", render: (r) => `${r.project.code} — ${r.project.name}` },
  { key: "version", header: "Version" },
  { key: "items", header: "Items", className: "text-right", render: (r) => r._count.items },
  { key: "totalAmount", header: "Total", className: "text-right", render: (r) => formatMoney(r.totalAmount) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function BoqPage() {
  await requirePermission(PERMISSIONS.BOQ_READ);
  const boqs = await listBoqs();

  return (
    <div>
      <PageHeader
        title="Bill of Quantities"
        description="Multi-level BOQs per project with rate analysis and auto-computed rates."
        actionHref="/boq/new"
        actionLabel="New BOQ"
      />
      <DataTable columns={columns} rows={boqs} rowKey={(r) => r.id} emptyMessage="No BOQs yet — create one." />
    </div>
  );
}
