"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function ProjectForm({
  clients,
  managers,
}: {
  clients: { id: number; name: string }[];
  managers: { id: number; firstName: string; lastName: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/clients/projects", "/clients/projects");
  const [f, setF] = useState({
    code: "",
    name: "",
    clientId: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "0",
    status: "PLANNING",
    managerEmployeeId: "",
    description: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code: f.code,
      name: f.name,
      clientId: f.clientId ? Number(f.clientId) : null,
      location: f.location || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      budget: Number(f.budget),
      status: f.status,
      managerEmployeeId: f.managerEmployeeId ? Number(f.managerEmployeeId) : null,
      description: f.description || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Project Code *</Label>
            <Input value={f.code} onChange={(e) => set("code", e.target.value)} required placeholder="PRJ-001" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Tower Residency Phase 2" />
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
          <div className="space-y-2 sm:col-span-2">
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
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
