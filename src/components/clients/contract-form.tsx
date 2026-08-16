"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function ContractForm({
  clients,
  projects,
}: {
  clients: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/clients/contracts", "/clients/contracts");
  const [f, setF] = useState({ clientId: "", projectId: "", contractNo: "", title: "", value: "", startDate: "", endDate: "", status: "ACTIVE" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      clientId: Number(f.clientId),
      projectId: f.projectId ? Number(f.projectId) : null,
      contractNo: f.contractNo,
      title: f.title,
      value: Number(f.value),
      startDate: f.startDate,
      endDate: f.endDate || null,
      status: f.status,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={f.clientId} onChange={(e) => set("clientId", e.target.value)} required>
              <option value="">— Select —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contract No *</Label>
            <Input value={f.contractNo} onChange={(e) => set("contractNo", e.target.value)} required placeholder="CTR-2026-001" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {["DRAFT", "ACTIVE", "COMPLETED", "TERMINATED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Construction of Boundary Wall" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Value (PKR) *</Label>
            <Input type="number" min="0" step="any" value={f.value} onChange={(e) => set("value", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Contract"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
