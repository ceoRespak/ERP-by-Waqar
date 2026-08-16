"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function MaintenanceForm({
  vehicles,
  vendors,
}: {
  vehicles: { id: number; regNo: string }[];
  vendors: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/vehicles/maintenance", "/vehicles/maintenance");
  const [f, setF] = useState({ vehicleId: "", date: "", type: "", description: "", cost: "", vendorId: "", nextDueKm: "", status: "COMPLETED" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vehicleId: Number(f.vehicleId),
      date: f.date || null,
      type: f.type,
      description: f.description,
      cost: Number(f.cost),
      vendorId: f.vendorId ? Number(f.vendorId) : null,
      nextDueKm: f.nextDueKm ? Number(f.nextDueKm) : null,
      status: f.status,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Maintenance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Vehicle *</Label>
            <Select value={f.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} required>
              <option value="">— Select —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.regNo}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Input value={f.type} onChange={(e) => set("type", e.target.value)} required placeholder="OIL_CHANGE / TYRE / REPAIR" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input value={f.description} onChange={(e) => set("description", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cost (PKR) *</Label>
              <Input type="number" step="any" value={f.cost} onChange={(e) => set("cost", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Next Due KM</Label>
              <Input type="number" step="any" value={f.nextDueKm} onChange={(e) => set("nextDueKm", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Service Provider</Label>
            <Select value={f.vendorId} onChange={(e) => set("vendorId", e.target.value)}>
              <option value="">— None —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Maintenance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
