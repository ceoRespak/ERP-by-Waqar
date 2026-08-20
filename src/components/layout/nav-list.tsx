"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { PendingApprovalsBadge } from "@/components/layout/pending-approvals-badge";

/**
 * Shared navigation list used by the desktop Sidebar and the mobile drawer.
 * `tone` switches link colors between the dark sidebar and light contexts.
 */
export function NavList({
  onNavigate,
  tone = "dark",
}: {
  onNavigate?: () => void;
  tone?: "dark" | "light";
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      tone === "dark"
                        ? active
                          ? "bg-primary/15 text-primary-foreground"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        : active
                          ? "bg-primary/15 text-primary"
                          : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.href === "/approvals" && <PendingApprovalsBadge />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
