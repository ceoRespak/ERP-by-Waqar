import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  /** Render as a gradient banner. */
  hero?: boolean;
  /** "dark" = colorful blue banner (default), "light" = professional light banner (finance). */
  tone?: "dark" | "light";
  /** Decorative icon shown when `hero` is set. */
  icon?: LucideIcon;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, actionHref, actionLabel, hero, tone = "dark", icon: Icon, children }: Props) {
  if (hero) {
    if (tone === "light") {
      return (
        <div className="fin-hero">
          <div className="fin-hero-blob" />
          <div className="fin-hero-blob-2" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sky-700 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-6 w-6" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {children}
              {actionHref && (
                <Link
                  href={actionHref}
                  className={cn(buttonVariants({}), "gap-2 bg-sky-600 text-white shadow hover:bg-sky-700")}
                >
                  <Plus className="h-4 w-4" />
                  {actionLabel ?? "New"}
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="inv-hero">
        <div className="inv-hero-blob" />
        <div className="inv-hero-blob-2" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
              {description && <p className="mt-1 max-w-2xl text-sm text-sky-100/90">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {children}
            {actionHref && (
              <Link
                href={actionHref}
                className={cn(buttonVariants({ variant: "secondary" }), "gap-2 bg-white text-sky-700 shadow hover:bg-sky-50 hover:text-sky-800")}
              >
                <Plus className="h-4 w-4" />
                {actionLabel ?? "New"}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

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
