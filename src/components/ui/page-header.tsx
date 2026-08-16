import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, actionHref, actionLabel, children }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionHref && (
          <Link href={actionHref} className={cn(buttonVariants({}), "gap-2")}>
            <Plus className="h-4 w-4" />
            {actionLabel ?? "New"}
          </Link>
        )}
      </div>
    </div>
  );
}
