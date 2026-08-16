import { Badge, type BadgeProps } from "@/components/ui/badge";

export const PROJECT_CATEGORIES = [
  "CONSTRUCTION",
  "REAL_ESTATE",
  "SUPPLY_WORKS",
  "SOLARIZATION",
  "OTHER",
] as const;

export const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  CONSTRUCTION: "Construction",
  REAL_ESTATE: "Real Estate",
  SUPPLY_WORKS: "Supply Works",
  SOLARIZATION: "Solarization",
  OTHER: "Other",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function ProjectCategoryBadge({ category }: { category: string }) {
  const variant: BadgeProps["variant"] =
    category === "CONSTRUCTION" ? "info"
      : category === "REAL_ESTATE" ? "success"
      : category === "SUPPLY_WORKS" ? "warning"
      : category === "SOLARIZATION" ? "secondary"
      : "outline";
  return <Badge variant={variant}>{PROJECT_CATEGORY_LABELS[category] ?? category}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const variant: BadgeProps["variant"] =
    status === "ACTIVE" ? "success"
      : status === "COMPLETED" ? "info"
      : status === "ON_HOLD" ? "warning"
      : status === "CANCELLED" ? "destructive"
      : "secondary";
  return <Badge variant={variant}>{PROJECT_STATUS_LABELS[status] ?? status}</Badge>;
}
