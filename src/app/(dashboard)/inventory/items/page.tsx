import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ItemForm } from "@/components/inventory/item-form";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { parsePage } from "@/lib/pagination";
import { Boxes, PackageCheck, AlertTriangle, PackageX, Search } from "lucide-react";

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
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/inventory/items/${r.id}`} className="hover:underline">
          {r.name}
        </Link>
        {!r.isInventoryItem && (
          <Badge variant="muted" className="shrink-0">Non-stock</Badge>
        )}
      </div>
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
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const params = await searchParams;
  const page = parsePage(params.page);
  const q = (params.q ?? "").trim().toLowerCase();
  const categoryId = params.category ? Number(params.category) : undefined;

  const [allItems, categories, warehouses] = await Promise.all([
    prisma.item.findMany({
      include: { category: true, stockLevels: { include: { warehouse: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  let items = allItems;
  if (q) items = items.filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  if (categoryId) items = items.filter((i) => i.categoryId === categoryId);

  const onHand = (r: Item) => r.stockLevels.reduce((s, l) => s + l.quantity.toNumber(), 0);
  const lowStock = allItems.filter((r) => {
    const h = onHand(r);
    return h > 0 && h <= r.reorderLevel.toNumber();
  });
  const outOfStock = allItems.filter((r) => onHand(r) <= 0);

  const statCards = [
    { label: "Total Items", value: formatNumber(allItems.length), icon: Boxes, accent: "from-sky-500 to-blue-600", tone: "" },
    { label: "Active Items", value: formatNumber(allItems.filter((i) => i.isActive).length), icon: PackageCheck, accent: "from-emerald-500 to-teal-600", tone: "" },
    { label: "Low Stock", value: formatNumber(lowStock.length), icon: AlertTriangle, accent: "from-amber-500 to-orange-600", tone: lowStock.length > 0 ? "text-amber-600" : "" },
    { label: "Out of Stock", value: formatNumber(outOfStock.length), icon: PackageX, accent: "from-rose-500 to-red-600", tone: outOfStock.length > 0 ? "text-rose-600" : "" },
  ];

  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (categoryId) filterParams.set("category", String(categoryId));
  const filterQs = filterParams.toString();
  const baseHref = `/inventory/items${filterQs ? `?${filterQs}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Items" description="Master list of all materials and services tracked in inventory." hero icon={Boxes} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className={`mt-1 truncate text-2xl font-bold ${c.tone}`}>{c.value}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <form method="get" action="/inventory/items" className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Search items</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by code or name..." className="pl-8" />
          </div>
        </div>
        <div className="space-y-1 sm:w-56">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select name="category" defaultValue={categoryId ? String(categoryId) : ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">Filter</Button>
          {(q || categoryId) && (
            <Link href="/inventory/items" className={buttonVariants({ variant: "ghost" })}>Clear</Link>
          )}
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DataTable columns={columns} rows={items as Item[]} rowKey={(r) => r.id} emptyMessage="No items match your filters." page={page} pageSize={PAGE_SIZE} baseHref={baseHref} headerClassName="inv-table-head" zebra />
        </div>
        <div>
          <ItemForm categories={categories} warehouses={warehouses} />
        </div>
      </div>
    </div>
  );
}
