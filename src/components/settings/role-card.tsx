"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULE_LABELS, ACTIONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type Permission = { id: number; key: string; module: string; action: string };
export type RolePermission = { permission: Permission };
export type Role = {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  _count: { users: number };
  permissions: RolePermission[];
};

export function RoleCard({ role, permissions }: { role: Role; permissions: Permission[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(role.permissions.map((p) => p.permission.id))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const byModule = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = byModule.get(p.module) ?? [];
    list.push(p);
    byModule.set(p.module, list);
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/settings/roles/${role.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMsg({ type: "ok", text: "Permissions saved." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">
            {role.name} {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {role.description ?? "No description"} · {role._count.users} users
          </p>
        </div>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent>
        {msg && (
          <p className={`mb-3 text-sm ${msg.type === "ok" ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>
        )}
        <div className="space-y-3">
          {[...byModule.entries()].map(([module, perms]) => (
            <div key={module}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {MODULE_LABELS[module] ?? module}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS.map((action) => {
                  const perm = perms.find((p) => p.action === action);
                  if (!perm) return null;
                  const checked = selected.has(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => toggle(perm.id)}
                      className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {action}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
