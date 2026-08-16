"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type Line = { componentType: string; description: string; quantity: string; unit: string; unitRate: string };

type Existing = {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheadPct: number;
  profitPct: number;
  rate: number;
  lines: { componentType: string; description: string; quantity: number; unit: string; unitRate: number }[];
};

/**
 * Inline rate-analysis editor for a BOQ item.
 * Live-computes material / labor / equipment totals and the derived rate:
 *   baseCost = Σ materials + Σ labor + Σ equipment
 *   rate     = baseCost × (1 + overhead% + profit%) / quantity
 */
export function RateAnalysisForm({
  boqId,
  itemId,
  quantity,
  existing,
  onClose,
}: {
  boqId: number;
  itemId: number;
  quantity: number;
  existing?: Existing | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [overheadPct, setOverheadPct] = useState(String(existing?.overheadPct ?? 0));
  const [profitPct, setProfitPct] = useState(String(existing?.profitPct ?? 0));
  const [lines, setLines] = useState<Line[]>(
    existing?.lines.length
      ? existing.lines.map((l) => ({
          componentType: l.componentType,
          description: l.description,
          quantity: String(l.quantity),
          unit: l.unit,
          unitRate: String(l.unitRate),
        }))
      : [{ componentType: "MATERIAL", description: "", quantity: "1", unit: "EA", unitRate: "0" }]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  // Live computation
  const material = lines.filter((l) => l.componentType === "MATERIAL").reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitRate) || 0), 0);
  const labor = lines.filter((l) => l.componentType === "LABOR").reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitRate) || 0), 0);
  const equipment = lines.filter((l) => l.componentType === "EQUIPMENT").reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitRate) || 0), 0);
  const baseCost = material + labor + equipment;
  const rate = quantity > 0 ? (baseCost * (1 + ((Number(overheadPct) || 0) + (Number(profitPct) || 0)) / 100)) / quantity : 0;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boq/${boqId}/items/${itemId}/rate-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overheadPct: Number(overheadPct) || 0,
          profitPct: Number(profitPct) || 0,
          lines: lines.map((l) => ({
            componentType: l.componentType,
            description: l.description,
            quantity: Number(l.quantity) || 0,
            unit: l.unit,
            unitRate: Number(l.unitRate) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Rate Analysis</p>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      <div className="space-y-3">
        {lines.map((l, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-12">
            <div className="sm:col-span-2">
              <Select value={l.componentType} onChange={(e) => updateLine(idx, { componentType: e.target.value })}>
                {["MATERIAL", "LABOR", "EQUIPMENT"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Input value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} placeholder="Description" />
            </div>
            <div className="sm:col-span-1">
              <Input type="number" min="0" step="any" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
            </div>
            <div className="sm:col-span-1">
              <Input value={l.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })} placeholder="unit" />
            </div>
            <div className="sm:col-span-2">
              <Input type="number" min="0" step="any" value={l.unitRate} onChange={(e) => updateLine(idx, { unitRate: e.target.value })} placeholder="rate" />
            </div>
            <div className="flex items-center justify-end sm:col-span-2">
              <span className="text-sm font-medium">{formatMoney((Number(l.quantity) || 0) * (Number(l.unitRate) || 0))}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} disabled={lines.length === 1}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { componentType: "MATERIAL", description: "", quantity: "1", unit: "EA", unitRate: "0" }])}>
            <Plus className="h-4 w-4" /> Add Line
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs">Overhead %</Label>
            <Input type="number" className="w-20" value={overheadPct} onChange={(e) => setOverheadPct(e.target.value)} />
            <Label className="text-xs">Profit %</Label>
            <Input type="number" className="w-20" value={profitPct} onChange={(e) => setProfitPct(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-2 rounded-md bg-background p-3 text-sm sm:grid-cols-5">
          <div><span className="text-muted-foreground">Materials: </span><span className="font-medium">{formatMoney(material)}</span></div>
          <div><span className="text-muted-foreground">Labor: </span><span className="font-medium">{formatMoney(labor)}</span></div>
          <div><span className="text-muted-foreground">Equipment: </span><span className="font-medium">{formatMoney(equipment)}</span></div>
          <div><span className="text-muted-foreground">Base: </span><span className="font-medium">{formatMoney(baseCost)}</span></div>
          <div><span className="text-muted-foreground">Computed Rate: </span><span className="font-bold text-primary">{formatMoney(rate)}</span></div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Saving..." : "Save Rate Analysis"}
          </Button>
        </div>
      </div>
    </div>
  );
}
