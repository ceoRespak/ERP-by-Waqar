"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Copy, Plus, X } from "lucide-react";

type Perm = { id: number; key: string; module: string; action: string; category: string; section: string | null; description: string | null };

const CATEGORY_LABELS: Record<string, string> = {
  OPERATIONAL: "Operational Permissions",
  APPROVAL: "Approval Permissions",
  SECTION: "Section Access",
};

export function UserPermissionAssigner({
  userId,
  permissions,
  initialGrants,
  assignedProjects,
  allProjects,
  roles,
}: {
  userId: number;
  permissions: Perm[];
  initialGrants: { projectId: number | null; permissionKey: string }[];
  assignedProjects: { id: number; code: string; name: string }[];
  allProjects: { id: number; code: string; name: string }[];
  roles: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState<string>("global");
  const [granted, setGranted] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const g of initialGrants) {
      const k = g.projectId == null ? "global" : `p${g.projectId}`;
      (map[k] ??= []).push(g.permissionKey);
    }
    return map;
  });
  const [selected, setSelected] = useState<Set<string>>(() => new Set((granted["global"] ?? [])));
  const [assignProjectId, setAssignProjectId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const scopeProjectId = scope === "global" ? null : Number(scope.slice(1));

  function changeScope(next: string) {
    setScope(next);
    setSelected(new Set(granted[next] ?? []));
    setError(null);
    setOkMsg(null);
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setLoading("save");
    setError(null);
    setOkMsg(null);
    try {
      const res = await fetch(`/api/settings/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: scopeProjectId, permissionKeys: Array.from(selected) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setGranted((prev) => ({ ...prev, [scope]: Array.from(selected) }));
      setOkMsg("Permissions saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(null);
    }
  }

  async function applyRole() {
    if (!roleId) return;
    setLoading("role");
    setError(null);
    setOkMsg(null);
    try {
      const res = await fetch(`/api/settings/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: scopeProjectId, roleId: Number(roleId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Apply failed");
      setGranted((prev) => ({ ...prev, [scope]: Array.from(selected) }));
      setOkMsg(`Role "${data.roleName ?? roleId}" applied (${data.granted ?? 0} permissions).`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setLoading(null);
    }
  }

  async function addProject() {
    if (!assignProjectId) return;
    setLoading("project");
    setError(null);
    try {
      const res = await fetch(`/api/settings/users/${userId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: [Number(assignProjectId)] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Assign failed");
      setAssignProjectId("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setLoading(null);
    }
  }

  async function removeProject(projectId: number) {
    setLoading("project");
    setError(null);
    try {
      const res = await fetch(`/api/settings/users/${userId}/projects?projectId=${projectId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Remove failed");
      if (scope === `p${projectId}`) changeScope("global");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setLoading(null);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<string, { section: string | null; perms: Perm[] }[]> = { OPERATIONAL: [], APPROVAL: [], SECTION: [] };
    for (const p of permissions) {
      const cat = g[p.category] ?? (g[p.category] = []);
      let sectionGroup = cat.find((c) => c.section === (p.category === "SECTION" ? p.section : p.module));
      if (!sectionGroup) {
        sectionGroup = { section: p.category === "SECTION" ? p.section : p.module, perms: [] };
        cat.push(sectionGroup);
      }
      sectionGroup.perms.push(p);
    }
    return g;
  }, [permissions]);

  const unassigned = allProjects.filter((p) => !assignedProjects.some((a) => a.id === p.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project & Permission Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scope selector */}
        <div className="space-y-2">
          <Label>Scope</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={scope === "global" ? "default" : "outline"} onClick={() => changeScope("global")}>
              Company-wide (all projects)
            </Button>
            {assignedProjects.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1">
                <Button type="button" size="sm" variant={scope === `p${p.id}` ? "default" : "outline"} onClick={() => changeScope(`p${p.id}`)}>
                  {p.name}
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeProject(p.id)} title="Remove project">
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
          {unassigned.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)}>
                <option value="">+ Assign project…</option>
                {unassigned.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </Select>
              <Button type="button" size="sm" variant="outline" onClick={addProject} disabled={!assignProjectId || loading === "project"}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          )}
        </div>

        {/* Role template */}
        {roles.length > 0 && (
          <div className="flex items-end gap-2 rounded-md border p-3">
            <div className="flex-1 space-y-1">
              <Label>Apply role template (replaces current scope)</Label>
              <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                <option value="">— Select a role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={applyRole} disabled={!roleId || loading === "role"}>
              {loading === "role" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Apply
            </Button>
          </div>
        )}

        {/* Permission toggles */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, sectionGroups]) => (
            <div key={cat}>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[cat] ?? cat}</h4>
              {sectionGroups.map((sg) => (
                <div key={`${cat}-${sg.section}`} className="mb-2 rounded-md border p-2">
                  <p className="mb-1 text-xs font-medium capitalize">{String(sg.section).replaceAll("_", " ")}</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {sg.perms.map((p) => (
                      <label key={p.key} className="flex items-start gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent/40">
                        <input type="checkbox" className="mt-0.5 h-3.5 w-3.5" checked={selected.has(p.key)} onChange={() => toggle(p.key)} />
                        <span>
                          <span className="font-mono text-xs">{p.key}</span>
                          {p.description && <span className="block text-xs text-muted-foreground">{p.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
        <Button onClick={save} disabled={loading === "save"} className="w-full">
          {loading === "save" ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />} Save Permissions for this Scope
        </Button>
      </CardContent>
    </Card>
  );
}
