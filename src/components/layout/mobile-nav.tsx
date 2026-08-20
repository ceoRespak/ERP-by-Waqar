"use client";

import { useState } from "react";
import { Menu, X, Building2 } from "lucide-react";
import { NavList } from "@/components/layout/nav-list";

/**
 * Hamburger button + slide-out navigation drawer for screens below `lg`,
 * where the fixed desktop sidebar is hidden.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-100 lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold tracking-wide">RESPAK ERP</p>
                  <p className="text-[11px] text-slate-400">Construction Management</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavList tone="dark" onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
