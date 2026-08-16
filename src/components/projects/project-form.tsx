"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PROJECT_CATEGORIES } from "@/components/projects/project-meta";

const ROLES = ["VIEWER", "EDITOR", "APPROVER", "MANAGER"];

type TeamRow = { userId: string; role: string };

export function ProjectForm({
  clients,
  managers,
  users,
}: {
  clients: { id: number; name: string }[];
  managers: { id: number; firstName: string; lastName: string }[];
  users: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/projects", "/projects");
  const [f, setF] = useState({
    code: "",
    name: "",
    category: "CONSTRUCTION",
    clientId: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "0",
    status: "PLANNING",
    managerEmployeeId: "",
    description: "",
  });
  const [team, setTeam] = useState<TeamRow[]>([]);

  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  function updateTeam(idx: number, patch: Partial<TeamRow>) {
    setTeam((t) => t.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code: f.code,
      name: f.name,
      category: f.category,
      clientId: f.clientId ? Number(f.clientId) : null,
      location: f.location || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      budget: Number(f.budget),
      status: f.status,
      managerEmployeeId: f.managerEmployeeId ? Number(f.managerEmployeeId) : null,
      description: f.description || null,
      projectUsers: team
        .filter((t) => t.userId)
        .map((t) => ({ userId: Number(t.userId), role: t.role })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Project Code *</Label>
            <Input value={f.code} onChange={(e) => set("code", e.target.value)} required placeholder="PRJ-005" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={f.category} onChange={(e) => set("category", e.target.value)}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Project Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Solar Park — 5 MW" />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={f.clientId} onChange={(e) => set("clientId", e.target.value)}>
              <option value="">— None —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project Manager</Label>
            <Select value={f.managerEmployeeId} onChange={(e) => set("managerEmployeeId", e.target.value)}>
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={f.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Budget (PKR)</Label>
            <Input type="number" min="0" step="any" value={f.budget} onChange={(e) => set("budget", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Team (project access)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setTeam((t) => [...t, { userId: "", role: "VIEWER" }])}>
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {team.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members assigned yet — admins see all projects regardless.
            </p>
          )}
          {team.map((row, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Select value={row.userId} onChange={(e) => updateTeam(idx, { userId: e.target.value })}>
                  <option value="">— Select user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Select value={row.role} onChange={(e) => updateTeam(idx, { role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => setTeam((t) => t.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
