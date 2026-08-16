import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        info: "border-transparent bg-sky-100 text-sky-800",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

/** Map a record status string to a badge variant */
export function statusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const s = status.toUpperCase();
  if (["APPROVED", "POSTED", "PAID", "COMPLETED", "ACTIVE", "SENT", "PRESENT"].includes(s)) return "success";
  if (["PENDING", "DRAFT", "PARTIAL", "IN_MAINTENANCE", "ON_HOLD", "PARTIALLY_RECEIVED", "SCHEDULED"].includes(s)) return "warning";
  if (["REJECTED", "CANCELLED", "BLACKLISTED", "TERMINATED", "OUT_OF_SERVICE", "INACTIVE", "ABSENT", "OVERDUE"].includes(s)) return "destructive";
  return "secondary";
}
