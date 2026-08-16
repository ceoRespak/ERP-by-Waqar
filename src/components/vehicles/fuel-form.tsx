"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function FuelForm({
  vehicles,
  vendors,
}: {
  vehicles: { id: number; regNo: string }[];
  vendors: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/vehicles/fuel", "/vehicles/fuel");
  const [f, setF] = useState({ vehicleId: "", date: "", odometer: "", liters: "", rate: "", vendorId: "", notes: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vehicleId: Number(f.vehicleId),
      date: f.date || null,
      odometer: f.odometer ? Number(f.odometer) : null,
      liters: Number(f.liters),
      rate: Number(f.rate),
      vendorId: f.vendorId ? Number(f.vendorId) : null,
      notes: f.notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Fuel</CardTitle>
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
              <Label>Odometer (KM)</Label>
              <Input type="number" step="any" value={f.odometer} onChange={(e) => set("odometer", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Liters *</Label>
              <Input type="number" step="any" value={f.liters} onChange={(e) => set("liters", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Rate (PKR/L) *</Label>
              <Input type="number" step="any" value={f.rate} onChange={(e) => set("rate", e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fuel Station (Vendor)</Label>
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
            {loading ? "Saving..." : "Save Fuel Log"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
