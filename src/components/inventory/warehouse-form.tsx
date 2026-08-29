"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Warehouse } from "lucide-react";

export function WarehouseForm({ onCreated }: { onCreated?: () => void }) {
  const { submit, loading, error } = useSubmit("/api/inventory/warehouses", "/inventory/warehouses");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ code, name, location: location || null });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="inv-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Warehouse className="h-4 w-4" />
          New Warehouse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="WH-01" />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Main Store" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow hover:from-amber-600 hover:to-orange-700 hover:text-white">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Warehouse"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
