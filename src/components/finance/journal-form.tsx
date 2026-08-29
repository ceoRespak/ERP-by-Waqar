"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { formatMoney } from "@/lib/utils";
import { Plus, Trash2, Loader2, ScrollText, ListChecks } from "lucide-react";

type Line = { accountId: string; projectId: string; itemId: string; vendorId: string; debit: string; credit: string; notes: string };

export function JournalForm({
  accounts,
  vendors,
  projects,
  items,
}: {
  accounts: { id: number; code: string; name: string }[];
  vendors: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
  items: { id: number; code: string; name: string; unit: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/finance/journal", "/finance/journal");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([{ accountId: "", projectId: "", itemId: "", vendorId: "", debit: "0", credit: "0", notes: "" }]);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit({
      date: date || null,
      description,
      lines: lines.map((l) => ({
        accountId: Number(l.accountId),
        projectId: l.projectId ? Number(l.projectId) : null,
        vendorId: l.vendorId ? Number(l.vendorId) : null,
        itemId: l.itemId ? Number(l.itemId) : null,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        notes: l.notes || undefined,
      })),
    });
    if (ok) {
      setDate("");
      setDescription("");
      setLines([{ accountId: "", projectId: "", itemId: "", vendorId: "", debit: "0", credit: "0", notes: "" }]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="fin-card-header">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <ScrollText className="h-4 w-4" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Office rent for August" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ListChecks className="h-4 w-4 text-violet-600" />
              Lines (must balance)
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { accountId: "", projectId: "", itemId: "", vendorId: "", debit: "0", credit: "0", notes: "" }])}>
              <Plus className="h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((l, idx) => (
              <div key={idx} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Account *</Label>
                  <Select value={l.accountId} onChange={(e) => updateLine(idx, { accountId: e.target.value })} required>
                    <option value="">— Select —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Item</Label>
                <Select value={l.itemId} onChange={(e) => updateLine(idx, { itemId: e.target.value })}>
                  <option value="">— None —</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Project *</Label>
                <Select value={l.projectId} onChange={(e) => updateLine(idx, { projectId: e.target.value })} required>
                  <option value="">— Select project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Vendor</Label>
                  <Select value={l.vendorId} onChange={(e) => updateLine(idx, { vendorId: e.target.value })}>
                    <option value="">— None —</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Debit</Label>
                  <Input type="number" min="0" step="any" value={l.debit} onChange={(e) => updateLine(idx, { debit: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Credit</Label>
                  <Input type="number" min="0" step="any" value={l.credit} onChange={(e) => updateLine(idx, { credit: e.target.value })} />
                </div>
                <div className="flex items-end justify-end sm:col-span-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} disabled={lines.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-1 sm:col-span-12">
                  <Label className="text-xs">Notes</Label>
                  <Input value={l.notes} onChange={(e) => updateLine(idx, { notes: e.target.value })} />
                </div>
              </div>
            ))}
            <div className={`grid gap-2 rounded-xl border p-4 sm:grid-cols-3 ${balanced ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Debits</p>
                <p className="mt-0.5 text-lg font-bold text-emerald-700">PKR {formatMoney(totalDebit)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Credits</p>
                <p className="mt-0.5 text-lg font-bold text-rose-700">PKR {formatMoney(totalCredit)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <p className={`mt-0.5 text-lg font-bold ${balanced ? "text-emerald-600" : "text-amber-600"}`}>
                  {balanced ? "✓ Balanced" : "Not balanced"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !balanced} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow hover:from-violet-600 hover:to-purple-700 hover:text-white">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Saving..." : "Save Journal Entry"}
        </Button>
      </div>
    </form>
  );
}
