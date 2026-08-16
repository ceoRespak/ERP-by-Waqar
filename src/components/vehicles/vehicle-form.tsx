"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

const VEHICLE_TYPES = ["TRUCK", "CAR", "PICKUP", "LOADER", "CRANE", "GENERATOR", "MOTORBIKE", "OTHER"];
const FUEL_TYPES = ["PETROL", "DIESEL", "CNG", "ELECTRIC"];

export function VehicleForm({ drivers }: { drivers: { id: number; firstName: string; lastName: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/vehicles", "/vehicles");
  const [f, setF] = useState({
    regNo: "",
    type: "CAR",
    brand: "",
    model: "",
    year: "",
    capacity: "",
    fuelType: "DIESEL",
    purchaseDate: "",
    cost: "",
    currentKm: "",
    driverEmployeeId: "",
    notes: "",
  });

  function set<K extends keyof typeof f>(key: K, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      regNo: f.regNo,
      type: f.type,
      brand: f.brand || null,
      model: f.model || null,
      year: f.year ? Number(f.year) : null,
      capacity: f.capacity || null,
      fuelType: f.fuelType,
      purchaseDate: f.purchaseDate || null,
      cost: f.cost ? Number(f.cost) : null,
      currentKm: f.currentKm ? Number(f.currentKm) : null,
      driverEmployeeId: f.driverEmployeeId ? Number(f.driverEmployeeId) : null,
      notes: f.notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Register Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Registration No *</Label>
            <Input value={f.regNo} onChange={(e) => set("regNo", e.target.value)} required placeholder="LEA-1234" />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Toyota" />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Hilux" />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={f.year} onChange={(e) => set("year", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input value={f.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="e.g. 1 ton" />
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select value={f.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned Driver</Label>
            <Select value={f.driverEmployeeId} onChange={(e) => set("driverEmployeeId", e.target.value)}>
              <option value="">— None —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Current KM</Label>
            <Input type="number" step="any" value={f.currentKm} onChange={(e) => set("currentKm", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cost (PKR)</Label>
            <Input type="number" step="any" value={f.cost} onChange={(e) => set("cost", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Register Vehicle"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
