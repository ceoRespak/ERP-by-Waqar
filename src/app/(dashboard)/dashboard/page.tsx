import Link from "next/link";
import { getDashboardStats } from "@/server/dashboard/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
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
} from "lucide-react";

export default async function DashboardPage() {
  const { stats, lowStockItems, recentApprovals } = await getDashboardStats();

  const cards = [
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: ClipboardCheck, href: "/approvals", color: "text-amber-600" },
    { label: "Requisitions", value: stats.requisitionCount, icon: ShoppingCart, href: "/procurement/requisitions", color: "text-sky-600" },
    { label: "Purchase Orders", value: stats.poCount, icon: FileText, href: "/procurement/purchase-orders", color: "text-indigo-600" },
    { label: "Low / Empty Stock", value: stats.lowStockCount, icon: AlertTriangle, href: "/inventory/stock", color: "text-rose-600" },
    { label: "Active Employees", value: stats.employeeCount, icon: Users, href: "/hr/employees", color: "text-emerald-600" },
    { label: "Active Projects", value: stats.activeProjects, icon: HardHat, href: "/clients/projects", color: "text-violet-600" },
    { label: "Vehicles", value: stats.vehicleCount, icon: Car, href: "/vehicles", color: "text-cyan-600" },
    { label: "Vendors", value: stats.vendorCount, icon: Truck, href: "/vendors", color: "text-teal-600" },
  ];

  const complianceCards = [
    { label: "Open Budget Alerts", value: stats.openBudgetAlerts, icon: AlertTriangle, href: "/budget", color: "text-amber-600" },
    { label: "Open NCRs", value: stats.openNcrs, icon: ShieldCheck, href: "/iso", color: "text-rose-600" },
    { label: "High Risks (≥15)", value: stats.openRisks, icon: ShieldAlert, href: "/iso", color: "text-orange-600" },
    { label: "Docs Expiring (45d)", value: stats.docsExpiring, icon: FileWarning, href: "/documents", color: "text-amber-600" },
    { label: "Material Requests", value: stats.openMaterialRequests, icon: Boxes, href: "/materials", color: "text-sky-600" },
    { label: "Pending VOs", value: stats.pendingVariations, icon: Calculator, href: "/cost", color: "text-indigo-600" },
    { label: "Pending IPCs", value: stats.pendingIpcs, icon: Calculator, href: "/cost", color: "text-violet-600" },
    { label: "Open Incidents", value: stats.openIncidents, icon: ShieldAlert, href: "/iso", color: "text-red-600" },
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
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
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
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{formatNumber(c.value)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Approvals</CardTitle>
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
            <CardTitle className="text-base">Low / Zero Stock Alert</CardTitle>
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
