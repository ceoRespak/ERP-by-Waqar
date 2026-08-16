"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { ProjectSwitcher } from "@/components/projects/project-switcher";

type Props = {
  user: { name?: string | null; email?: string | null; roles: string[] };
};

export function Topbar({ user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <ProjectSwitcher />
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-muted"
        >
          <Avatar name={user.name} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight">{user.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{user.roles.join(", ")}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border bg-popover p-1 shadow-lg">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                className="mt-1 w-full justify-start text-destructive hover:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
