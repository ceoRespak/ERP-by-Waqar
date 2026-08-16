"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2, GitBranch, Calculator } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { RateAnalysisForm } from "@/components/boq/rate-analysis-form";

type Line = { componentType: string; description: string; quantity: number; unit: string; unitRate: number };
type RateAnalysis = {
  materialCost: number; laborCost: number; equipmentCost: number;
  overheadPct: number; profitPct: number; rate: number;
  lines: Line[];
} | null;
type Item = {
  id: number; parentId: number | null; itemCode: string; description: string;
  category: string | null; unit: string; quantity: number; rate: number; amount: number;
  rateAnalysis: RateAnalysis;
};
type AddForm = { itemCode: string; description: string; category: string; unit: string; quantity: string; rate: string };

const EMPTY_FORM: AddForm = { itemCode: "", description: "", category: "", unit: "EA", quantity: "1", rate: "0" };

export function BoqEditor({
  boqId,
  boqCode,
  items,
}: {
  boqId: number;
  boqCode: string;
  items: Item[];
}) {
  const router = useRouter();
  const [addParent, setAddParent] = useState<number | null>(null);
  const [rateItem, setRateItem] = useState<number | null>(null);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childrenOf = (parentId: number | null) => items.filter((i) => (i.parentId ?? null) === parentId);
  const roots = childrenOf(null);

  function set<K extends keyof AddForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAdd(parent: number | null) {
    setForm(EMPTY_FORM);
    setAddParent(parent);
    setRateItem(null);
  }

  async function addItem() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boq/${boqId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: addParent,
          itemCode: form.itemCode,
          description: form.description,
          category: form.category || null,
          unit: form.unit,
          quantity: Number(form.quantity),
          rate: Number(form.rate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add item");
      setAddParent(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: Item) {
    if (!confirm(`Delete "${item.itemCode} — ${item.description}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boq/${boqId}/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    } finally {
      setBusy(false);
    }
  }

  function renderRow(item: Item, depth: number): React.ReactNode {
    const hasChildren = childrenOf(item.id).length > 0;
    return (
      <div key={item.id}>
        <div
          className="grid gap-2 border-b px-3 py-2 hover:bg-muted/40 sm:grid-cols-12"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <div className="sm:col-span-2">
            <span className="font-mono text-xs font-medium">{item.itemCode}</span>
          </div>
          <div className="sm:col-span-4">
            <p className="text-sm font-medium">{item.description}</p>
            {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
          </div>
          <div className="text-sm text-muted-foreground sm:col-span-1">{item.unit}</div>
          <div className="text-right text-sm sm:col-span-2">{item.quantity}</div>
          <div className="text-right text-sm sm:col-span-1">{formatMoney(item.rate)}</div>
          <div className="flex items-center justify-end gap-1 sm:col-span-2">
            <span className="mr-2 text-sm font-semibold">{formatMoney(item.amount)}</span>
            <Button type="button" variant="ghost" size="icon" title="Add sub-item" onClick={() => openAdd(item.id)}>
              <GitBranch className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" title="Rate analysis" onClick={() => setRateItem(rateItem === item.id ? null : item.id)}>
              <Calculator className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" title="Delete" onClick={() => deleteItem(item)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {addParent === item.id && renderAddForm(`Sub-item under ${item.itemCode}`, item.id)}
        {rateItem === item.id && (
          <div className="border-b px-3 py-3" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
            <RateAnalysisForm
              boqId={boqId}
              itemId={item.id}
              quantity={item.quantity}
              existing={item.rateAnalysis}
              onClose={() => setRateItem(null)}
            />
          </div>
        )}

        {childrenOf(item.id).map((child) => renderRow(child, depth + 1))}
      </div>
    );
  }

  function renderAddForm(label: string, parentId: number | null) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3" style={{ marginLeft: parentId != null ? 24 : 0 }}>
        <p className="mb-2 text-sm font-semibold">{label}</p>
        <div className="grid gap-2 sm:grid-cols-12">
          <div className="sm:col-span-2">
            <Input value={form.itemCode} onChange={(e) => set("itemCode", e.target.value)} placeholder="Code" />
          </div>
          <div className="sm:col-span-3">
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description *" />
          </div>
          <div className="sm:col-span-1">
            <Select value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              {["EA", "BAG", "TON", "CUBIC", "SFT", "RFT", "DAY", "LS", "SET"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Input type="number" min="0" step="any" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="Qty" />
          </div>
          <div className="sm:col-span-2">
            <Input type="number" min="0" step="any" value={form.rate} onChange={(e) => set("rate", e.target.value)} placeholder="Rate" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="button" size="sm" onClick={addItem} disabled={busy || !form.itemCode || !form.description}>
              {busy ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAddParent(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-12">
          <div className="sm:col-span-2">Code</div>
          <div className="sm:col-span-4">Description</div>
          <div className="sm:col-span-1">Unit</div>
          <div className="text-right sm:col-span-2">Quantity</div>
          <div className="text-right sm:col-span-1">Rate</div>
          <div className="text-right sm:col-span-2">Amount</div>
        </div>

        {roots.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No items yet — add the first BOQ item below. ({boqCode})
          </p>
        )}
        {roots.map((r) => renderRow(r, 0))}

        {addParent === null && <div className="p-3">{renderAddForm("Add top-level item", null)}</div>}
        {roots.length === 0 && addParent === null && null}

        {error && <p className="px-3 pb-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
