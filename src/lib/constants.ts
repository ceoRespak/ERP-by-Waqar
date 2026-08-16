// =====================================================================
// Central constants: modules, permission keys, approval entity types
// =====================================================================

export const MODULES = {
  PROCUREMENT: "procurement",
  INVENTORY: "inventory",
  FINANCE: "finance",
  HR: "hr",
  VEHICLES: "vehicles",
  VENDORS: "vendors",
  CLIENTS: "clients",
  SITES: "sites",
  SETTINGS: "settings",
  PROJECTS: "projects",
  BOQ: "boq",
  PROGRESS: "progress",
  BUDGET: "budget",
  COST: "cost",
  MATERIALS: "materials",
  DOCUMENTS: "documents",
  ISO: "iso",
  CORRESPONDENCE: "correspondence",
} as const;

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES];

/** Actions available for each module */
export const ACTIONS = ["read", "create", "update", "delete", "approve"] as const;

export function permissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}

export const PERMISSIONS = {
  PROCUREMENT_READ: "procurement:read",
  PROCUREMENT_CREATE: "procurement:create",
  PROCUREMENT_UPDATE: "procurement:update",
  PROCUREMENT_DELETE: "procurement:delete",
  PROCUREMENT_APPROVE: "procurement:approve",

  INVENTORY_READ: "inventory:read",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",
  INVENTORY_APPROVE: "inventory:approve",

  FINANCE_READ: "finance:read",
  FINANCE_CREATE: "finance:create",
  FINANCE_UPDATE: "finance:update",
  FINANCE_DELETE: "finance:delete",
  FINANCE_APPROVE: "finance:approve",

  HR_READ: "hr:read",
  HR_CREATE: "hr:create",
  HR_UPDATE: "hr:update",
  HR_DELETE: "hr:delete",
  HR_APPROVE: "hr:approve",

  VEHICLES_READ: "vehicles:read",
  VEHICLES_CREATE: "vehicles:create",
  VEHICLES_UPDATE: "vehicles:update",
  VEHICLES_DELETE: "vehicles:delete",
  VEHICLES_APPROVE: "vehicles:approve",

  VENDORS_READ: "vendors:read",
  VENDORS_CREATE: "vendors:create",
  VENDORS_UPDATE: "vendors:update",
  VENDORS_DELETE: "vendors:delete",
  VENDORS_APPROVE: "vendors:approve",

  CLIENTS_READ: "clients:read",
  CLIENTS_CREATE: "clients:create",
  CLIENTS_UPDATE: "clients:update",
  CLIENTS_DELETE: "clients:delete",
  CLIENTS_APPROVE: "clients:approve",

  SITES_READ: "sites:read",
  SITES_CREATE: "sites:create",
  SITES_UPDATE: "sites:update",
  SITES_DELETE: "sites:delete",
  SITES_APPROVE: "sites:approve",

  SETTINGS_READ: "settings:read",
  SETTINGS_CREATE: "settings:create",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_DELETE: "settings:delete",
  SETTINGS_APPROVE: "settings:approve",

  PROJECTS_READ: "projects:read",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_UPDATE: "projects:update",
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_APPROVE: "projects:approve",

  BOQ_READ: "boq:read",
  BOQ_CREATE: "boq:create",
  BOQ_UPDATE: "boq:update",
  BOQ_DELETE: "boq:delete",
  BOQ_APPROVE: "boq:approve",

  PROGRESS_READ: "progress:read",
  PROGRESS_CREATE: "progress:create",
  PROGRESS_UPDATE: "progress:update",
  PROGRESS_DELETE: "progress:delete",
  PROGRESS_APPROVE: "progress:approve",

  BUDGET_READ: "budget:read",
  BUDGET_CREATE: "budget:create",
  BUDGET_UPDATE: "budget:update",
  BUDGET_DELETE: "budget:delete",
  BUDGET_APPROVE: "budget:approve",

  COST_READ: "cost:read",
  COST_CREATE: "cost:create",
  COST_UPDATE: "cost:update",
  COST_DELETE: "cost:delete",
  COST_APPROVE: "cost:approve",

  MATERIALS_READ: "materials:read",
  MATERIALS_CREATE: "materials:create",
  MATERIALS_UPDATE: "materials:update",
  MATERIALS_DELETE: "materials:delete",
  MATERIALS_APPROVE: "materials:approve",

  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_CREATE: "documents:create",
  DOCUMENTS_UPDATE: "documents:update",
  DOCUMENTS_DELETE: "documents:delete",
  DOCUMENTS_APPROVE: "documents:approve",

  ISO_READ: "iso:read",
  ISO_CREATE: "iso:create",
  ISO_UPDATE: "iso:update",
  ISO_DELETE: "iso:delete",
  ISO_APPROVE: "iso:approve",

  CORRESPONDENCE_READ: "correspondence:read",
  CORRESPONDENCE_CREATE: "correspondence:create",
  CORRESPONDENCE_UPDATE: "correspondence:update",
  CORRESPONDENCE_DELETE: "correspondence:delete",
  CORRESPONDENCE_APPROVE: "correspondence:approve",
} as const;

// =====================================================================
// Approval entity types -> linked Prisma model + status field
// Used by the approval engine to flip status on the source record.
// =====================================================================
export const APPROVAL_ENTITY_TYPES = {
  PURCHASE_REQUISITION: "PURCHASE_REQUISITION",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  CHECK_REQUEST: "CHECK_REQUEST",
  LEAVE_REQUEST: "LEAVE_REQUEST",
  JOURNAL_ENTRY: "JOURNAL_ENTRY",
  PAYROLL_RUN: "PAYROLL_RUN",
  CLIENT_INVOICE: "CLIENT_INVOICE",
  PAYMENT: "PAYMENT",
  DPR: "DPR",
  SUBMITTAL: "SUBMITTAL",
  MATERIAL_REQUEST: "MATERIAL_REQUEST",
  VARIATION_ORDER: "VARIATION_ORDER",
  IPC: "IPC",
  NCR: "NCR",
  SAFETY_INCIDENT: "SAFETY_INCIDENT",
} as const;

export type ApprovalEntityType = (typeof APPROVAL_ENTITY_TYPES)[keyof typeof APPROVAL_ENTITY_TYPES];

/**
 * Maps an approval entity type to the Prisma model and status field used
 * to reflect the workflow state on the source record.
 */
export const ENTITY_STATUS_MAP: Record<
  ApprovalEntityType,
  { model: string; statusField: string; pendingStatus: string; approvedStatus: string; rejectedStatus: string }
> = {
  PURCHASE_REQUISITION: {
    model: "purchaseRequisition",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  PURCHASE_ORDER: {
    model: "purchaseOrder",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  CHECK_REQUEST: {
    model: "checkRequest",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  LEAVE_REQUEST: {
    model: "leaveRequest",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  JOURNAL_ENTRY: {
    model: "journalEntry",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "POSTED",
    rejectedStatus: "REJECTED",
  },
  PAYROLL_RUN: {
    model: "payrollRun",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  CLIENT_INVOICE: {
    model: "clientInvoice",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "UNPAID",
    rejectedStatus: "REJECTED",
  },
  PAYMENT: {
    model: "payment",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  DPR: {
    model: "dpr",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  SUBMITTAL: {
    model: "submittal",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  MATERIAL_REQUEST: {
    model: "materialRequest",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  VARIATION_ORDER: {
    model: "variationOrder",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "APPROVED",
    rejectedStatus: "REJECTED",
  },
  IPC: {
    model: "iPC",
    statusField: "status",
    pendingStatus: "PENDING",
    approvedStatus: "CERTIFIED",
    rejectedStatus: "REJECTED",
  },
  NCR: {
    model: "nCR",
    statusField: "status",
    pendingStatus: "UNDER_REVIEW",
    approvedStatus: "ACTION_TAKEN",
    rejectedStatus: "CLOSED",
  },
  SAFETY_INCIDENT: {
    model: "safetyIncident",
    statusField: "investigationStatus",
    pendingStatus: "UNDER_INVESTIGATION",
    approvedStatus: "COMPLETED",
    rejectedStatus: "CLOSED",
  },
};

/** Human-readable labels for the approval entity types */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  PURCHASE_REQUISITION: "Purchase Requisition",
  PURCHASE_ORDER: "Purchase Order",
  CHECK_REQUEST: "Check Request",
  LEAVE_REQUEST: "Leave Request",
  JOURNAL_ENTRY: "Journal Entry",
  PAYROLL_RUN: "Payroll Run",
  CLIENT_INVOICE: "Client Invoice",
  PAYMENT: "Payment",
  DPR: "Daily Progress Report",
  SUBMITTAL: "Submittal",
  MATERIAL_REQUEST: "Material Request",
  VARIATION_ORDER: "Variation Order",
  IPC: "Interim Payment Certificate",
  NCR: "Non-Conformance Report",
  SAFETY_INCIDENT: "Safety Incident",
};

// =====================================================================
// Navigation / module labels
// =====================================================================
export const MODULE_LABELS: Record<string, string> = {
  procurement: "Procurement",
  inventory: "Inventory",
  finance: "Finance",
  hr: "HR & Payroll",
  vehicles: "Vehicle Tracking",
  vendors: "Vendors",
  clients: "Clients",
  sites: "Site Management",
  settings: "Settings",
  projects: "Projects",
  boq: "BOQ",
  progress: "Progress",
  budget: "Budgeting",
  cost: "Cost Control",
  materials: "Materials",
  documents: "Document Control",
  iso: "ISO Compliance",
  correspondence: "Correspondence",
};

// =====================================================================
// AUTO REFERENCE NUMBERING — doc types for NumberingConfig
// =====================================================================
export const REF_DOC_TYPES = {
  LETTER_IN: "LETTER_IN",
  LETTER_OUT: "LETTER_OUT",
  INTERNAL_MEMO: "INTERNAL_MEMO",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  MATERIAL_REQUEST: "MATERIAL_REQUEST",
  GRN: "GRN",
  IPC: "IPC",
  VARIATION_ORDER: "VARIATION_ORDER",
  NCR: "NCR",
  BOQ: "BOQ",
} as const;

export type RefDocType = (typeof REF_DOC_TYPES)[keyof typeof REF_DOC_TYPES];

/** Cost type options used by budget lines, cost logs and cost centers. */
export const COST_TYPES = ["MATERIAL", "LABOR", "EQUIPMENT", "OVERHEAD", "OTHER"] as const;
export type CostType = (typeof COST_TYPES)[number];

export const VO_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;
export const IPC_STATUSES = ["DRAFT", "PENDING", "APPROVED", "CERTIFIED", "REJECTED"] as const;
export const BUDGET_STATUSES = ["DRAFT", "APPROVED", "REVISED"] as const;

// Document control domain values
export const DOCUMENT_MODULES = ["QUALITY", "ENVIRONMENT", "SAFETY", "HR", "PROCUREMENT", "GENERAL"] as const;
export const DOCUMENT_TYPES = ["POLICY", "PROCEDURE", "SOP", "FORM", "RECORD", "MANUAL", "OTHER"] as const;
export const ISO_STANDARDS = ["ISO9001", "ISO14001", "ISO45001", "NONE"] as const;
export const DOC_STATUSES = ["DRAFT", "UNDER_REVIEW", "APPROVED", "OBSOLETE"] as const;

// ISO compliance domain values
export const NCR_SOURCES = ["INSPECTION", "AUDIT", "CUSTOMER", "INTERNAL"] as const;
export const NCR_SEVERITY = ["MINOR", "MAJOR", "CRITICAL"] as const;
export const NCR_STATUSES = ["OPEN", "UNDER_REVIEW", "ACTION_TAKEN", "CLOSED"] as const;
export const ACTION_TYPES = ["CORRECTIVE", "PREVENTIVE"] as const;
export const ACTION_STATUSES = ["OPEN", "IN_PROGRESS", "VERIFIED", "CLOSED"] as const;
export const RISK_STATUSES = ["OPEN", "MITIGATED", "CLOSED"] as const;
export const SIGNIFICANCE = ["LOW", "MEDIUM", "HIGH"] as const;
export const COMPETENCY_LEVELS = ["BASIC", "INTERMEDIATE", "ADVANCED"] as const;
export const INCIDENT_TYPES = ["NEAR_MISS", "FIRST_AID", "LOST_TIME", "FATAL"] as const;
export const INCIDENT_SEVERITY = ["MINOR", "MODERATE", "MAJOR", "SEVERE"] as const;
export const INCIDENT_STATUSES = ["OPEN", "UNDER_INVESTIGATION", "COMPLETED", "CLOSED"] as const;

// Correspondence domain values
export const CORRESPONDENCE_TYPES = ["LETTER_IN", "LETTER_OUT", "INTERNAL_MEMO"] as const;
export const CORRESPONDENCE_STATUSES = ["DRAFT", "SENT", "RECEIVED", "FILED"] as const;
