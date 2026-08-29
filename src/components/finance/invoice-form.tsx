"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { formatMoney } from "@/lib/utils";
import { Plus, Trash2, Loader2, ReceiptText, ListChecks, Calculator } from "lucide-react";

type Line = { description: string; quantity: string; unitPrice: string };

export function InvoiceForm({
  clients,
  projects,
}: {
  clients: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/finance/invoices", "/finance/invoices");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: "1", unitPrice: "0" }]);

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const tax = (subtotal * (Number(taxRate) || 0)) / 100;
  const grandTotal = subtotal + tax;

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit({
      clientId: Number(clientId),
      projectId: projectId || null,
      date: date || null,
      dueDate: dueDate || null,
      taxRate: Number(taxRate) || 0,
      notes: notes || null,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      })),
    });
    if (ok) {
      setClientId("");
      setProjectId("");
      setDate("");
      setDueDate("");
      setTaxRate("0");
      setNotes("");
      setLines([{ description: "", quantity: "1", unitPrice: "0" }]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="fin-card-header">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <ReceiptText className="h-4 w-4" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">— Select —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Invoice Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input type="number" min="0" step="any" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="fin-card-header flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <ListChecks className="h-4 w-4" />
            Line Items
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => setLines((ls) => [...ls, { description: "", quantity: "1", unitPrice: "0" }])}>
            <Plus className="h-4 w-4" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
              <div className="space-y-1 sm:col-span-7">
                <Label className="text-xs">Description *</Label>
                <Input value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min="0" step="any" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Unit Price</Label>
                <Input type="number" min="0" step="any" value={l.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: e.target.value })} />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <Calculator className="h-5 w-5 shrink-0 text-sky-600" />
            <div className="grid flex-1 gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subtotal</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">PKR {formatMoney(subtotal)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tax ({taxRate || 0}%)</p>
                <p className="mt-0.5 text-lg font-bold text-amber-600">PKR {formatMoney(tax)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="mt-0.5 text-lg font-bold text-sky-700">PKR {formatMoney(grandTotal)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow hover:from-amber-600 hover:to-orange-700 hover:text-white">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}
