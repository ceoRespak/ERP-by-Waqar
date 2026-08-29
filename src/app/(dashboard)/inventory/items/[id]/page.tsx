import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getItemDetail } from "@/server/inventory/service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ItemEditForm } from "@/components/inventory/item-edit-form";
import { formatDate, formatNumber, cn } from "@/lib/utils";
import { Boxes, CheckCircle2, Layers, Package, PackageX, Tag, Ruler } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const item = await getItemDetail(Number(id));
  if (!item) notFound();

  const categories = await prisma.itemCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const totalOnHand = item.stockLevels.reduce((s, l) => s + l.quantity.toNumber(), 0);

  const levelColumns: Column<(typeof item.stockLevels)[number]>[] = [
    { key: "warehouse", header: "Warehouse", render: (r) => <span className="font-medium">{r.warehouse.name}</span> },
    { key: "quantity", header: "On Hand", className: "text-right", render: (r) => formatNumber(r.quantity) },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.quantity.toNumber() <= 0 ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : r.quantity.toNumber() <= item.reorderLevel.toNumber() ? (
          <Badge variant="warning">Low stock</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        ),
    },
  ];

  const txnColumns: Column<(typeof item.transactions)[number]>[] = [
    { key: "transactionNo", header: "Txn No", render: (r) => <span className="font-mono text-xs font-medium">{r.transactionNo}</span> },
    { key: "type", header: "Type", render: (r) => <Badge variant={statusVariant(r.type)}>{r.type.replace("_", " ")}</Badge> },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse.name },
    { key: "quantity", header: "Qty", className: "text-right", render: (r) => formatNumber(r.quantity) },
    { key: "unitCost", header: "Unit Cost", className: "text-right", render: (r) => formatNumber(r.unitCost) },
    { key: "refType", header: "Reference", render: (r) => (r.refType ? `${r.refType}${r.refId ? `#${r.refId}` : ""}` : "—") },
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  const statCards = item.isInventoryItem
    ? [
        { label: "On Hand", value: `${formatNumber(totalOnHand)} ${item.unit}`, icon: Layers, accent: "from-emerald-500 to-teal-600" },
        { label: "Reorder Level", value: formatNumber(item.reorderLevel), icon: Package, accent: "from-amber-500 to-orange-600" },
        { label: "Category", value: item.category?.name ?? "—", icon: Tag, accent: "from-sky-500 to-blue-600" },
        { label: "Unit", value: item.unit, icon: Ruler, accent: "from-violet-500 to-purple-600" },
      ]
    : [
        { label: "Tracking", value: "Non-stock", icon: PackageX, accent: "from-slate-500 to-slate-600" },
        { label: "Category", value: item.category?.name ?? "—", icon: Tag, accent: "from-sky-500 to-blue-600" },
        { label: "Unit", value: item.unit, icon: Ruler, accent: "from-violet-500 to-purple-600" },
        { label: "Status", value: item.isActive ? "Active" : "Inactive", icon: CheckCircle2, accent: "from-emerald-500 to-teal-600" },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${item.code} — ${item.name}`}
        description={`${item.category?.name ?? "Uncategorized"} · ${item.unit}${item.isInventoryItem ? ` · reorder at ${formatNumber(item.reorderLevel)}` : " · non-stock / service item"}`}
        hero
        icon={Boxes}
      >
        {!item.isInventoryItem && (
          <Badge variant="secondary" className="bg-white/20 text-white ring-1 ring-white/30">
            Non-stock
          </Badge>
        )}
        <Badge variant={statusVariant(item.isActive ? "ACTIVE" : "INACTIVE")} className="bg-white/20 text-white ring-1 ring-white/30">
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 truncate text-xl font-bold">{c.value}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {item.isInventoryItem && (
          <div className="min-w-0 lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="inv-card-header">
                <CardTitle className="text-base text-white">
                  Stock by Warehouse{" "}
                  <span className="ml-1 text-sm font-normal text-sky-100">(total {formatNumber(totalOnHand)} {item.unit})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable columns={levelColumns} rows={item.stockLevels} rowKey={(r) => r.id} emptyMessage="No stock recorded yet." headerClassName="inv-table-head" zebra />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="inv-card-header">
                <CardTitle className="text-base text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable columns={txnColumns} rows={item.transactions} rowKey={(r) => r.id} emptyMessage="No transactions yet." headerClassName="inv-table-head" zebra />
              </CardContent>
            </Card>
          </div>
        )}

        <div className={cn("space-y-6", item.isInventoryItem ? "lg:col-span-1" : "lg:col-span-3")}>
          <Card className="overflow-hidden">
            <CardHeader className="inv-card-header">
              <CardTitle className="text-base text-white">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono font-medium">{item.code}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Category</span>
                <span>{item.category?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Unit</span>
                <span>{item.unit}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tracking</span>
                <Badge variant={item.isInventoryItem ? "info" : "muted"}>{item.isInventoryItem ? "Inventory (stock)" : "Non-stock"}</Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Reorder Level</span>
                <span>{item.isInventoryItem ? formatNumber(item.reorderLevel) : "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Opening Stock</span>
                <span>{item.isInventoryItem ? formatNumber(item.openingStock) : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Description</span>
                <p className="mt-1">{item.description ?? "No description."}</p>
              </div>
            </CardContent>
          </Card>

          <ItemEditForm
            item={{
              id: item.id,
              code: item.code,
              name: item.name,
              unit: item.unit,
              reorderLevel: item.reorderLevel.toNumber(),
              categoryId: item.categoryId,
              description: item.description,
              isActive: item.isActive,
              isInventoryItem: item.isInventoryItem,
            }}
            categories={categories}
          />

          <Link href="/inventory/items" className="inline-block text-sm font-medium text-sky-600 hover:underline">
            ← Back to Items
          </Link>
        </div>
      </div>
    </div>
  );
}
