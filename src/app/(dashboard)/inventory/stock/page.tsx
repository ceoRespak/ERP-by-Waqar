import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { stockLevels, getStockValuation } from "@/server/inventory/service";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/utils";
import { parsePage } from "@/lib/pagination";
import { Wallet, Layers, AlertTriangle, PackageX } from "lucide-react";

const PAGE_SIZE = 20;

type Row = Awaited<ReturnType<typeof stockLevels>>[number];

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_READ);
  const params = await searchParams;
  const page = parsePage(params.page);
  const [stock, valuation] = await Promise.all([stockLevels(), getStockValuation()]);

  const lowStock = stock.filter((r) => r.quantity.toNumber() > 0 && r.quantity.toNumber() <= r.item.reorderLevel.toNumber());
  const outOfStock = stock.filter((r) => r.quantity.toNumber() <= 0);

  const unitCostById = new Map(valuation.rows.map((r) => [`${r.item.id}-${r.warehouse}`, r.unitCost]));

  const columns: Column<Row>[] = [
    {
      key: "item",
      header: "Item",
      render: (r) => (
        <>
          <span className="font-medium">{r.item.name}</span>
          <span className="block text-xs text-muted-foreground">{r.item.code}</span>
        </>
      ),
    },
    { key: "category", header: "Category", render: (r) => r.item.category?.name ?? "—" },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse.name },
    { key: "quantity", header: "On Hand", className: "text-right", render: (r) => formatNumber(r.quantity) },
    {
      key: "unitCost",
      header: "Unit Cost",
      className: "text-right",
      render: (r) => formatMoney(unitCostById.get(`${r.item.id}-${r.warehouse.name}`) ?? 0),
    },
    {
      key: "value",
      header: "Value",
      className: "text-right",
      render: (r) => formatMoney(r.quantity.toNumber() * (unitCostById.get(`${r.item.id}-${r.warehouse.name}`) ?? 0)),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.quantity.toNumber() <= 0 ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : r.quantity.toNumber() <= r.item.reorderLevel.toNumber() ? (
          <Badge variant="warning">Low stock</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        ),
    },
  ];

  const statCards = [
    { label: "Total Stock Value", value: formatMoney(valuation.totalValue), icon: Wallet, accent: "from-emerald-500 to-teal-600", tone: "" },
    { label: "Stock Lines", value: formatNumber(stock.length), icon: Layers, accent: "from-sky-500 to-blue-600", tone: "" },
    { label: "Low Stock", value: formatNumber(lowStock.length), icon: AlertTriangle, accent: "from-amber-500 to-orange-600", tone: lowStock.length > 0 ? "text-amber-600" : "" },
    { label: "Out of Stock", value: formatNumber(outOfStock.length), icon: PackageX, accent: "from-rose-500 to-red-600", tone: outOfStock.length > 0 ? "text-rose-600" : "" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Levels"
        description="On-hand quantities per item and warehouse. Stock updates on GRN receipts, material issues, adjustments and transfers."
        actionHref="/inventory/transactions"
        actionLabel="Adjust Stock"
        hero
        icon={Layers}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className={`mt-1 truncate text-2xl font-bold ${c.tone ?? ""}`}>{c.value}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} rows={stock} rowKey={(r) => r.id} emptyMessage="No stock recorded yet — receive goods against a PO or add opening stock." page={page} pageSize={PAGE_SIZE} baseHref="/inventory/stock" headerClassName="inv-table-head" zebra />
    </div>
  );
}
