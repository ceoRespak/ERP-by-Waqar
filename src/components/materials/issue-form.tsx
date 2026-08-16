"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Trash2, PackageOpen } from "lucide-react";

type IssueLine = { itemId: string; quantity: string };

export function MaterialIssueForm({
  projectId,
  requests,
  warehouses,
  items,
}: {
  projectId: number;
  requests: { id: number; mrNo: string; status: string }[];
  warehouses: { id: number; code: string; name: string }[];
  items: { id: number; code: string; name: string; unit: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/materials/issues", `/materials?projectId=${projectId}`);
  const [requestId, setRequestId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<IssueLine[]>([{ itemId: "", quantity: "" }]);

  function setLine(i: number, patch: Partial<IssueLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      requestId: requestId ? Number(requestId) : null,
      warehouseId: warehouseId ? Number(warehouseId) : null,
      notes: notes || null,
      items: lines.filter((l) => l.itemId && Number(l.quantity) > 0).map((l) => ({ itemId: Number(l.itemId), quantity: Number(l.quantity) })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Issue Materials (Store → Project)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Against Request</Label>
              <Select value={requestId} onChange={(e) => setRequestId(e.target.value)}>
                <option value="">— Direct issue —</option>
                {requests
                  .filter((r) => r.status === "APPROVED" || r.status === "PARTIALLY_ISSUED")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.mrNo}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">— Default —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-8">
                  <Select value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}>
                    <option value="">— Item —</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.code} — {it.name} ({it.unit})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input type="number" min={0} step="0.01" value={l.quantity} placeholder="Qty" onChange={(e) => setLine(i, { quantity: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, { itemId: "", quantity: "" }])}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || lines.filter((l) => l.itemId && Number(l.quantity) > 0).length === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <PackageOpen className="h-4 w-4" />}
            {loading ? "Issuing..." : "Issue Materials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
