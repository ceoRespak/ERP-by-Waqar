"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FolderKanban, ChevronDown } from "lucide-react";

type Project = { id: number; code: string; name: string; category: string };

/** Quick project switcher in the topbar — jumps to a project's dashboard. */
export function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects?limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.projects && setProjects(d.projects))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        <FolderKanban className="h-4 w-4" />
        <span className="hidden sm:inline">Projects</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 max-h-96 w-80 overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Switch project
            </p>
            {projects.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No projects available.</p>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setOpen(false);
                  router.push(`/projects/${p.id}`);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{p.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
