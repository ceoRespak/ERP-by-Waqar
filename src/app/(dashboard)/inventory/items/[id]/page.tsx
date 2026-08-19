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
import { formatDate, formatNumber } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={`${item.code} — ${item.name}`} description={`${item.category?.name ?? "Uncategorized"} · ${item.unit} · reorder at ${formatNumber(item.reorderLevel)}`} />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(item.isActive ? "ACTIVE" : "INACTIVE")}>{item.isActive ? "Active" : "Inactive"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Stock by Warehouse{" "}
                <span className="ml-1 text-sm font-normal text-muted-foreground">(total {formatNumber(totalOnHand)} {item.unit})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={levelColumns} rows={item.stockLevels} rowKey={(r) => r.id} emptyMessage="No stock recorded yet." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={txnColumns} rows={item.transactions} rowKey={(r) => r.id} emptyMessage="No transactions yet." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
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
                <span className="text-muted-foreground">Reorder Level</span>
                <span>{formatNumber(item.reorderLevel)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Opening Stock</span>
                <span>{formatNumber(item.openingStock)}</span>
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
            }}
            categories={categories}
          />

          <Link href="/inventory/items" className="inline-block text-sm text-primary hover:underline">
            ← Back to Items
          </Link>
        </div>
      </div>
    </div>
  );
}
