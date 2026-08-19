import Link from "next/link";
import { getDashboardStats, getFinancialOverview } from "@/server/dashboard/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import {
  ClipboardCheck,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Users,
  HardHat,
  Car,
  Truck,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Calculator,
  FileWarning,
  Wallet,
  CreditCard,
  Receipt,
  ShoppingBag,
  PackageCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const [dash, financial] = await Promise.all([getDashboardStats(), getFinancialOverview()]);
  const { stats, lowStockItems, recentApprovals } = dash;

  const maxPurchased = Math.max(...financial.mostPurchased.map((i) => i.qty), 1);
  const maxSold = Math.max(...financial.mostSold.map((i) => i.qty), 1);
  const maxExpense = Math.max(...financial.expensesByUser.map((i) => i.amount), 1);

  const cards = [
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: ClipboardCheck, href: "/approvals", gradient: "from-amber-500 to-orange-600" },
    { label: "Requisitions", value: stats.requisitionCount, icon: ShoppingCart, href: "/procurement/requisitions", gradient: "from-sky-500 to-blue-600" },
    { label: "Purchase Orders", value: stats.poCount, icon: FileText, href: "/procurement/purchase-orders", gradient: "from-indigo-500 to-blue-700" },
    { label: "Low / Empty Stock", value: stats.lowStockCount, icon: AlertTriangle, href: "/inventory/stock", gradient: "from-rose-500 to-red-600" },
    { label: "Active Employees", value: stats.employeeCount, icon: Users, href: "/hr/employees", gradient: "from-emerald-500 to-green-600" },
    { label: "Active Projects", value: stats.activeProjects, icon: HardHat, href: "/clients/projects", gradient: "from-violet-500 to-purple-700" },
    { label: "Vehicles", value: stats.vehicleCount, icon: Car, href: "/vehicles", gradient: "from-cyan-500 to-sky-600" },
    { label: "Vendors", value: stats.vendorCount, icon: Truck, href: "/vendors", gradient: "from-teal-500 to-emerald-700" },
  ];

  const complianceCards = [
    { label: "Open Budget Alerts", value: stats.openBudgetAlerts, icon: AlertTriangle, href: "/budget", gradient: "from-amber-500 to-yellow-600" },
    { label: "Open NCRs", value: stats.openNcrs, icon: ShieldCheck, href: "/iso", gradient: "from-rose-500 to-pink-600" },
    { label: "High Risks (≥15)", value: stats.openRisks, icon: ShieldAlert, href: "/iso", gradient: "from-orange-500 to-red-600" },
    { label: "Docs Expiring (45d)", value: stats.docsExpiring, icon: FileWarning, href: "/documents", gradient: "from-amber-500 to-orange-600" },
    { label: "Material Requests", value: stats.openMaterialRequests, icon: Boxes, href: "/materials", gradient: "from-sky-500 to-cyan-600" },
    { label: "Pending VOs", value: stats.pendingVariations, icon: Calculator, href: "/cost", gradient: "from-indigo-500 to-violet-600" },
    { label: "Pending IPCs", value: stats.pendingIpcs, icon: Calculator, href: "/cost", gradient: "from-fuchsia-500 to-purple-700" },
    { label: "Open Incidents", value: stats.openIncidents, icon: ShieldAlert, href: "/iso", gradient: "from-red-500 to-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to RESPAK ERP — operational overview across all modules.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className={`bg-gradient-to-br ${c.gradient} border-0 text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/90">{c.label}</p>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <c.icon className="h-5 w-5 text-white" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold">{formatNumber(c.value)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Compliance, Quality & Risk</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {complianceCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className={`bg-gradient-to-br ${c.gradient} border-0 text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/90">{c.label}</p>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <c.icon className="h-5 w-5 text-white" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold">{formatNumber(c.value)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Financial Overview</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 text-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Receivables</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Wallet className="h-5 w-5 text-white" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{formatMoney(financial.receivables)}</p>
            <p className="mt-1 text-xs text-white/75">Outstanding client invoices</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-orange-600 border-0 text-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Payables</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <CreditCard className="h-5 w-5 text-white" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{formatMoney(financial.payables)}</p>
            <p className="mt-1 text-xs text-white/75">Outstanding supplier bills</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                <Receipt className="h-4 w-4" />
              </span>
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financial.recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
                {financial.recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.paymentNo}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "IN" ? "success" : "destructive"}>{t.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatMoney(t.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.accountName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                <ShoppingBag className="h-4 w-4" />
              </span>
              Most Purchased Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {financial.mostPurchased.length === 0 && (
              <p className="text-sm text-muted-foreground">No purchases recorded yet.</p>
            )}
            {financial.mostPurchased.map((it) => {
              const pct = Math.max(6, Math.round((it.qty / maxPurchased) * 100));
              return (
                <div key={it.id ?? it.code}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{it.name}</span>
                    <span className="ml-2 shrink-0 font-semibold">{formatNumber(it.qty)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <PackageCheck className="h-4 w-4" />
              </span>
              Most Sold Items (issued)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {financial.mostSold.length === 0 && (
              <p className="text-sm text-muted-foreground">No issues recorded yet.</p>
            )}
            {financial.mostSold.map((it) => {
              const pct = Math.max(6, Math.round((it.qty / maxSold) * 100));
              return (
                <div key={it.id ?? it.code}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{it.name}</span>
                    <span className="ml-2 shrink-0 font-semibold">{formatNumber(it.qty)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-fuchsia-100 text-fuchsia-700">
                <Users className="h-4 w-4" />
              </span>
              Expenses by User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {financial.expensesByUser.length === 0 && (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            )}
            {financial.expensesByUser.map((u) => {
              const pct = Math.max(6, Math.round((u.amount / maxExpense) * 100));
              return (
                <div key={u.userId ?? u.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{u.name}</span>
                    <span className="ml-2 shrink-0 font-semibold">{formatMoney(u.amount)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-fuchsia-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <ClipboardCheck className="h-4 w-4" />
              </span>
              Recent Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentApprovals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No approval activity yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentApprovals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link href={`/approvals/${a.id}`} className="font-medium text-primary hover:underline">
                        {ENTITY_TYPE_LABELS[a.entityType] ?? a.entityType}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(a.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Low / Zero Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      All stock levels are above zero. 🎉
                    </TableCell>
                  </TableRow>
                )}
                {lowStockItems.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="font-medium">{s.item.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.item.code}</span>
                    </TableCell>
                    <TableCell>{s.warehouse.name}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatNumber(s.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
