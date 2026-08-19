// =====================================================================
// DYNAMIC PERMISSION CATALOG
// Permissions are data, not constants: admins can create/edit them at
// runtime. This file defines the seeded catalog, grouped by category:
//   OPERATIONAL — CRUD-style actions (create/read/update/delete ...)
//   APPROVAL    — "approve X" actions
//   SECTION     — access to an ERP section (vendor liabilities, customer
//                 ledger, hr leave, inventory, ...)
// Grants are stored per (user, project) in UserProjectPermission.
// =====================================================================

export type PermissionCategory = "OPERATIONAL" | "APPROVAL" | "SECTION";

export type CatalogPermission = {
  module: string;
  action: string;
  key: string;
  category: PermissionCategory;
  section?: string;
  description?: string;
};

/** Base operational actions every module exposes (kept for back-compat keys). */
const BASE_ACTIONS = [
  { action: "read", description: "View records" },
  { action: "create", description: "Create records" },
  { action: "update", description: "Update records" },
  { action: "delete", description: "Delete records" },
] as const;

const BASE_MODULES: { module: string; label: string }[] = [
  { module: "procurement", label: "Procurement (PO, Purchase Bill)" },
  { module: "inventory", label: "Inventory" },
  { module: "finance", label: "Finance" },
  { module: "hr", label: "HR & Payroll" },
  { module: "vehicles", label: "Vehicle Tracking" },
  { module: "vendors", label: "Vendors" },
  { module: "clients", label: "Clients" },
  { module: "sites", label: "Site Management" },
  { module: "settings", label: "Settings" },
  { module: "projects", label: "Projects" },
  { module: "boq", label: "BOQ" },
  { module: "progress", label: "Progress" },
  { module: "budget", label: "Budgeting" },
  { module: "cost", label: "Cost Control" },
  { module: "materials", label: "Materials" },
  { module: "documents", label: "Document Control" },
  { module: "iso", label: "ISO Compliance" },
  { module: "correspondence", label: "Correspondence" },
];

/** Explicit approval permissions per module (module:approve). */
const APPROVE_MODULES: { module: string; label: string; section?: string }[] = [
  { module: "procurement", label: "Approve Purchase Order / Bill", section: "procurement" },
  { module: "boq", label: "Approve BOQ", section: "boq" },
  { module: "progress", label: "Approve Progress", section: "progress" },
  { module: "cost", label: "Approve Expenses", section: "cost" },
  { module: "finance", label: "Approve Payments", section: "finance" },
  { module: "hr", label: "Approve HR items", section: "hr" },
  { module: "inventory", label: "Approve Inventory", section: "inventory" },
  { module: "budget", label: "Approve Budget", section: "budget" },
  { module: "materials", label: "Approve Materials", section: "materials" },
  { module: "iso", label: "Approve ISO", section: "iso" },
];

/** Section-specific permissions (access to an ERP section). */
const SECTION_PERMISSIONS: CatalogPermission[] = [
  { module: "vendors", action: "liabilities", key: "vendor:liabilities", category: "SECTION", section: "vendor_liabilities", description: "View & manage vendor liabilities (assigned projects)" },
  { module: "clients", action: "ledger", key: "customer:ledger", category: "SECTION", section: "customer_ledger", description: "View customer ledger / balances (assigned projects)" },
  { module: "finance", action: "payments", key: "finance:payments", category: "SECTION", section: "payments", description: "Receive / manage payments" },
  { module: "cost", action: "expenses", key: "cost:expenses", category: "SECTION", section: "expenses", description: "Enter & manage project expenses" },
  { module: "inventory", action: "access", key: "inventory:access", category: "SECTION", section: "inventory", description: "Manage inventory for assigned projects" },
  { module: "hr", action: "leave", key: "hr:leave", category: "SECTION", section: "hr_leave", description: "HR leave module access" },
  { module: "hr", action: "payroll", key: "hr:payroll", category: "SECTION", section: "payroll", description: "HR payroll access" },
  { module: "hr", action: "attendance", key: "hr:attendance", category: "SECTION", section: "hr_attendance", description: "HR attendance access" },
  { module: "procurement", action: "bills", key: "procurement:bills", category: "SECTION", section: "purchase_bill", description: "Purchase Bill module access" },
  { module: "progress", action: "update", key: "progress:update", category: "SECTION", section: "progress", description: "Update project progress" },
  { module: "boq", action: "analysis", key: "boq:analysis", category: "SECTION", section: "boq_analysis", description: "Rate / cost analysis access" },
];

export function buildPermissionCatalog(): CatalogPermission[] {
  const catalog: CatalogPermission[] = [];
  for (const m of BASE_MODULES) {
    for (const a of BASE_ACTIONS) {
      catalog.push({
        module: m.module,
        action: a.action,
        key: `${m.module}:${a.action}`,
        category: "OPERATIONAL",
        section: m.label.toLowerCase().includes("vendor") ? "vendors" : m.label.toLowerCase().includes("client") ? "clients" : m.module,
        description: `${a.description} — ${m.label}`,
      });
    }
  }
  for (const m of APPROVE_MODULES) {
    catalog.push({
      module: m.module,
      action: "approve",
      key: `${m.module}:approve`,
      category: "APPROVAL",
      section: m.section ?? m.module,
      description: m.label,
    });
  }
  catalog.push(...SECTION_PERMISSIONS);
  return catalog;
}

export const PERMISSION_CATALOG = buildPermissionCatalog();

export const PERMISSION_CATEGORIES: PermissionCategory[] = ["OPERATIONAL", "APPROVAL", "SECTION"];
