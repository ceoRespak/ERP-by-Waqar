"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Plus, Trash2, Loader2, ScrollText, ListChecks } from "lucide-react";

type Line = { accountId: string; debit: string; credit: string; notes: string };

export function JournalForm({ accounts }: { accounts: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/finance/journal", "/finance/journal");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([{ accountId: "", debit: "0", credit: "0", notes: "" }]);

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
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        notes: l.notes || undefined,
      })),
    });
    if (ok) {
      setDate("");
      setDescription("");
      setLines([{ accountId: "", debit: "0", credit: "0", notes: "" }]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="inv-card-header">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ScrollText className="h-4 w-4" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Office rent for August" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="inv-card-header flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ListChecks className="h-4 w-4" />
            Lines (must balance)
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => setLines((ls) => [...ls, { accountId: "", debit: "0", credit: "0", notes: "" }])}>
            <Plus className="h-4 w-4" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
              <div className="space-y-1 sm:col-span-4">
                <Label className="text-xs">Account *</Label>
                <Select value={l.accountId} onChange={(e) => updateLine(idx, { accountId: e.target.value })} required>
                  <option value="">— Select —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Debit</Label>
                <Input type="number" min="0" step="any" value={l.debit} onChange={(e) => updateLine(idx, { debit: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Credit</Label>
                <Input type="number" min="0" step="any" value={l.credit} onChange={(e) => updateLine(idx, { credit: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Notes</Label>
                <Input value={l.notes} onChange={(e) => updateLine(idx, { notes: e.target.value })} />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <div className={`rounded-md px-3 py-2 text-sm ${balanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            Debits: {totalDebit.toFixed(2)} · Credits: {totalCredit.toFixed(2)} ·{" "}
            {balanced ? "Balanced ✓" : "Not balanced"}
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
