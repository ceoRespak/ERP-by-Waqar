import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ItemForm } from "@/components/inventory/item-form";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { parsePage } from "@/lib/pagination";

const PAGE_SIZE = 20;

type Item = Awaited<ReturnType<typeof prisma.item.findMany>>[number] & {
  category: { name: string } | null;
  stockLevels: { quantity: { toNumber(): number }; warehouse: { name: string } }[];
};

const columns: Column<Item>[] = [
  {
    key: "code",
    header: "Code",
    render: (r) => (
      <Link href={`/inventory/items/${r.id}`} className="font-medium text-primary hover:underline">
        {r.code}
      </Link>
    ),
  },
  {
    key: "name",
    header: "Name",
    render: (r) => (
      <Link href={`/inventory/items/${r.id}`} className="hover:underline">
        {r.name}
      </Link>
    ),
  },
  { key: "category", header: "Category", render: (r) => r.category?.name ?? "—" },
  { key: "unit", header: "Unit" },
  {
    key: "stock",
    header: "On Hand",
    className: "text-right",
    render: (r) => formatNumber(r.stockLevels.reduce((s, l) => s + l.quantity.toNumber(), 0)),
  },
  { key: "reorderLevel", header: "Reorder", className: "text-right", render: (r) => formatNumber(r.reorderLevel) },
  {
    key: "isActive",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.isActive ? "ACTIVE" : "INACTIVE")}>{r.isActive ? "Active" : "Inactive"}</Badge>,
  },
];

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const params = await searchParams;
  const page = parsePage(params.page);
  const [items, categories, warehouses] = await Promise.all([
    prisma.item.findMany({
      include: { category: true, stockLevels: { include: { warehouse: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Items" description="Master list of all materials and services tracked in inventory." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={items as Item[]} rowKey={(r) => r.id} emptyMessage="No items yet." page={page} pageSize={PAGE_SIZE} baseHref="/inventory/items" />
        </div>
        <div>
          <ItemForm categories={categories} warehouses={warehouses} />
        </div>
      </div>
    </div>
  );
}
