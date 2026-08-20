"use client";

import { NavList } from "@/components/layout/nav-list";
import { Building2 } from "lucide-react";

type Props = {
  user: { name?: string | null; roles: string[] };
};

export function Sidebar(_user: Props) {
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

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavList tone="dark" />
      </div>

      <div className="border-t border-slate-800 p-4 text-[11px] text-slate-500">
        <p>RESPAK (Pvt) Ltd.</p>
        <p>ERP v0.1.0</p>
      </div>
    </aside>
  );
}
