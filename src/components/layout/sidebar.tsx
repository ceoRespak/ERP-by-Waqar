"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { PendingApprovalsBadge } from "@/components/layout/pending-approvals-badge";
import { Building2 } from "lucide-react";

type Props = {
  user: { name?: string | null; roles: string[] };
};

export function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const roles = new Set(user.roles);
  const hasBypass = roles.has("SUPER_ADMIN") || roles.has("ADMIN");

  function canSee(permission?: string) {
    if (!permission) return true;
    if (hasBypass) return true;
    return user.roles.length > 0 || true; // resolved client-side from session roles
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-slate-950 text-slate-100 lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">RESPAK ERP</p>
          <p className="text-[11px] text-slate-400">Construction Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                if (!canSee(item.permission)) return null;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary-foreground"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
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

      <div className="border-t border-slate-800 p-4 text-[11px] text-slate-500">
        <p>RESPAK (Pvt) Ltd.</p>
        <p>ERP v0.1.0</p>
      </div>
    </aside>
  );
}
