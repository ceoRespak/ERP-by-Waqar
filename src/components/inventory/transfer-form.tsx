"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeftRight } from "lucide-react";

type Line = { itemId: string; quantity: string };

export function TransferForm({
  items,
  warehouses,
}: {
  items: { id: number; code: string; name: string; unit: string }[];
  warehouses: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", quantity: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) return;
    if (fromWarehouseId === toWarehouseId) {
      setError("Source and destination warehouses must be different.");
      return;
    }
    const payload = lines
      .filter((l) => l.itemId && l.quantity)
      .map((l) => ({ itemId: Number(l.itemId), quantity: Number(l.quantity) }));
    if (payload.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouseId: Number(fromWarehouseId),
          toWarehouseId: Number(toWarehouseId),
          notes: notes || null,
          items: payload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Transfer failed");
      setFromWarehouseId("");
      setToWarehouseId("");
      setNotes("");
      setLines([{ itemId: "", quantity: "" }]);
      setLoading(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Transfer failed");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From Warehouse *</Label>
              <Select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} required>
                <option value="">— Select —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Warehouse *</Label>
              <Select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} required>
                <option value="">— Select —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lines</Label>
            <div className="space-y-2">
              {lines.map((l, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Select value={l.itemId} onChange={(e) => setLine(idx, { itemId: e.target.value })}>
                      <option value="">Item</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Input type="number" step="any" min="0" value={l.quantity} onChange={(e) => setLine(idx, { quantity: e.target.value })} placeholder="Qty" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, { itemId: "", quantity: "" }])}>
              <Plus className="h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / reference" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
            {loading ? "Transferring..." : "Transfer Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
