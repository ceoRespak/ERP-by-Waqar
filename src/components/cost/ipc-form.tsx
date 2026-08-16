"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Trash2 } from "lucide-react";

type LineInput = { boqItemId: string; description: string; currentQty: string; rate: string };

export function IpcForm({
  projectId,
  boqItems,
}: {
  projectId: number;
  boqItems: { id: number; itemCode: string; description: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/cost/ipcs", `/cost?projectId=${projectId}`);
  const [period, setPeriod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [retention, setRetention] = useState("");
  const [deductions, setDeductions] = useState("");
  const [lines, setLines] = useState<LineInput[]>([{ boqItemId: "", description: "", currentQty: "", rate: "" }]);

  const gross = lines.reduce((s, l) => s + (Number(l.currentQty) || 0) * (Number(l.rate) || 0), 0);
  const net = gross - (Number(retention) || 0) - (Number(deductions) || 0);

  function setLine(i: number, patch: Partial<LineInput>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      period: period || null,
      fromDate: fromDate || null,
      toDate: toDate || null,
      retention: retention ? Number(retention) : 0,
      deductions: deductions ? Number(deductions) : 0,
      lines: lines
        .filter((l) => l.description && (Number(l.currentQty) || 0) > 0)
        .map((l) => ({
          boqItemId: l.boqItemId ? Number(l.boqItemId) : null,
          description: l.description,
          currentQty: Number(l.currentQty) || 0,
          rate: Number(l.rate) || 0,
        })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New IPC</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Period</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="IPC-02 / Aug 2026" />
            </div>
            <div>
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Work Done Lines</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-4">
                  <Select value={l.boqItemId} onChange={(e) => setLine(i, { boqItemId: e.target.value })}>
                    <option value="">— BOQ item —</option>
                    {boqItems.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.itemCode} — {b.description}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input value={l.description} placeholder="Description" onChange={(e) => setLine(i, { description: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Input type="number" min={0} value={l.currentQty} placeholder="Qty" onChange={(e) => setLine(i, { currentQty: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Input type="number" min={0} step="0.01" value={l.rate} placeholder="Rate" onChange={(e) => setLine(i, { rate: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, { boqItemId: "", description: "", currentQty: "", rate: "" }])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Retention</Label>
              <Input type="number" min={0} step="0.01" value={retention} onChange={(e) => setRetention(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Deductions</Label>
              <Input type="number" min={0} step="0.01" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span className="font-medium">{gross.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net Payable</span><span className="font-medium">{net.toLocaleString()}</span></div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || lines.filter((l) => l.description).length === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create IPC"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
