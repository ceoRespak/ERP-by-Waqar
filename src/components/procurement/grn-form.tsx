"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2 } from "lucide-react";

type Po = {
  id: number;
  poNo: string;
  vendorName: string;
  items: { id: number; itemId: number | null; description: string; quantity: number; receivedQty: number }[];
};

export function GrnForm({ purchaseOrders, warehouses }: { purchaseOrders: Po[]; warehouses: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/procurement/grns", "/procurement/grn");
  const [poId, setPoId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [qty, setQty] = useState<Record<number, string>>({});

  const selectedPo = purchaseOrders.find((p) => p.id === Number(poId));

  function handlePoChange(value: string) {
    setPoId(value);
    const po = purchaseOrders.find((p) => p.id === Number(value));
    if (po) {
      const initial: Record<number, string> = {};
      for (const item of po.items) {
        const remaining = item.quantity - item.receivedQty;
        initial[item.id] = String(Math.max(0, remaining));
      }
      setQty(initial);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPo) return;
    await submit({
      poId: selectedPo.id,
      warehouseId: warehouseId ? Number(warehouseId) : null,
      notes: null,
      items: selectedPo.items
        .filter((i) => Number(qty[i.id]) > 0)
        .map((i) => ({
          poItemId: i.id,
          itemId: i.itemId,
          receivedQty: Number(qty[i.id]),
        })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goods Receipt</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Purchase Order *</Label>
            <Select value={poId} onChange={(e) => handlePoChange(e.target.value)} required>
              <option value="">— Select PO —</option>
              {purchaseOrders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNo} — {p.vendorName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">— Default (Main Store) —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receive Quantities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPo.items.map((item) => {
              const remaining = item.quantity - item.receivedQty;
              return (
                <div key={item.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Ordered: {item.quantity} · Received: {item.receivedQty} · Remaining: {remaining}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Receive</Label>
                    <Input
                      type="number"
                      min="0"
                      max={remaining}
                      step="any"
                      value={qty[item.id] ?? "0"}
                      onChange={(e) => setQty((q) => ({ ...q, [item.id]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
            {selectedPo.items.every((i) => Number(qty[i.id] ?? 0) <= 0) && (
              <p className="text-sm text-muted-foreground">Enter at least one received quantity.</p>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !selectedPo}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Posting..." : "Post Goods Receipt"}
        </Button>
      </div>
    </form>
  );
}
