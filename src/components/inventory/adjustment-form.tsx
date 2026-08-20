"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function AdjustmentForm({ items, warehouses }: { items: { id: number; code: string; name: string }[]; warehouses: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/inventory/transactions", "/inventory/transactions");
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || !warehouseId || !quantity) return;
    await submit({
      itemId: Number(itemId),
      warehouseId: Number(warehouseId),
      quantity: Number(quantity),
      notes: notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock Adjustment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Item *</Label>
            <Select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
              <option value="">— Select —</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Warehouse *</Label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
              <option value="">— Select —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity (+ add / − remove) *</Label>
            <Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="e.g. 50 or -10" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for adjustment" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Posting..." : "Post Adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
