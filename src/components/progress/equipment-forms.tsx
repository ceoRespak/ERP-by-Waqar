"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function EquipmentForm({ projectId }: { projectId: number }) {
  const { submit, loading, error } = useSubmit("/api/progress/equipment", `/progress?projectId=${projectId}`);
  const [f, setF] = useState({ code: "", name: "", type: "", capacity: "", status: "ACTIVE" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ projectId, ...f, type: f.type || null, capacity: f.capacity || null });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Register Equipment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input value={f.code} onChange={(e) => set("code", e.target.value)} required placeholder="EQ-01" />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="Backhoe Loader" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Input value={f.type} onChange={(e) => set("type", e.target.value)} placeholder="EXCAVATOR" />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input value={f.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="e.g. 1.5 yd" />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Register Equipment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EquipmentUsageForm({
  projectId,
  equipments,
}: {
  projectId: number;
  equipments: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/progress/equipment-usage", `/progress?projectId=${projectId}`);
  const [f, setF] = useState({ equipmentId: "", date: new Date().toISOString().slice(0, 10), hours: "1", notes: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      equipmentId: Number(f.equipmentId),
      projectId,
      date: f.date,
      hours: Number(f.hours),
      notes: f.notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Equipment Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Equipment *</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={f.equipmentId} onChange={(e) => set("equipmentId", e.target.value)} required>
              <option value="">— Select —</option>
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.code} — {eq.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input type="number" min="0" step="any" value={f.hours} onChange={(e) => set("hours", e.target.value)} required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Log Usage"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
