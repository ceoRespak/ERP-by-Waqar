"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function TripForm({
  vehicles,
  drivers,
  projects,
}: {
  vehicles: { id: number; regNo: string }[];
  drivers: { id: number; firstName: string; lastName: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/vehicles/trips", "/vehicles/trips");
  const [f, setF] = useState({ vehicleId: "", driverEmployeeId: "", date: "", startKm: "", endKm: "", purpose: "", projectId: "", notes: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vehicleId: Number(f.vehicleId),
      driverEmployeeId: f.driverEmployeeId ? Number(f.driverEmployeeId) : null,
      date: f.date || null,
      startKm: f.startKm ? Number(f.startKm) : null,
      endKm: f.endKm ? Number(f.endKm) : null,
      purpose: f.purpose,
      projectId: f.projectId ? Number(f.projectId) : null,
      notes: f.notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Trip</CardTitle>
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
              <Label>Driver</Label>
              <Select value={f.driverEmployeeId} onChange={(e) => set("driverEmployeeId", e.target.value)}>
                <option value="">— None —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start KM</Label>
              <Input type="number" step="any" value={f.startKm} onChange={(e) => set("startKm", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End KM</Label>
              <Input type="number" step="any" value={f.endKm} onChange={(e) => set("endKm", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Input value={f.purpose} onChange={(e) => set("purpose", e.target.value)} required />
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Trip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
