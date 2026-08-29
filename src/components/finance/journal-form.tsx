"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { cn, formatMoney } from "@/lib/utils";
import { Plus, Trash2, Loader2, ScrollText, ListChecks, User, Truck, Building2 } from "lucide-react";

type Line = { accountId: string; projectId: string; debit: string; credit: string; notes: string };
type Party = "NONE" | "VENDOR" | "CLIENT";

export function JournalForm({
  accounts,
  vendors,
  projects,
}: {
  accounts: { id: number; code: string; name: string }[];
  vendors: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/finance/journal", "/finance/journal");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [party, setParty] = useState<Party>("NONE");
  const [vendorId, setVendorId] = useState("");
  const [customerProjectId, setCustomerProjectId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ accountId: "", projectId: "", debit: "0", credit: "0", notes: "" }]);

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
      vendorId: party === "VENDOR" && vendorId ? Number(vendorId) : null,
      projectId: party === "CLIENT" && customerProjectId ? Number(customerProjectId) : null,
      lines: lines.map((l) => ({
        accountId: Number(l.accountId),
        projectId: l.projectId ? Number(l.projectId) : null,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        notes: l.notes || undefined,
      })),
    });
    if (ok) {
      setDate("");
      setDescription("");
      setParty("NONE");
      setVendorId("");
      setCustomerProjectId("");
      setLines([{ accountId: "", projectId: "", debit: "0", credit: "0", notes: "" }]);
    }
  }

  const partyOptions: { value: Party; label: string; icon: typeof User }[] = [
    { value: "NONE", label: "None", icon: User },
    { value: "VENDOR", label: "Vendor", icon: Truck },
    { value: "CLIENT", label: "Customer", icon: Building2 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="inv-card-header">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ScrollText className="h-4 w-4" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Office rent for August" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Party (Vendor / Customer)</Label>
            <div className="grid grid-cols-3 gap-2">
              {partyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParty(opt.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                    party === opt.value
                      ? "border-violet-500 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
            {party === "VENDOR" && (
              <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-3">
                <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">— Select vendor —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </Select>
              </div>
            )}
            {party === "CLIENT" && (
              <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3">
                <Select value={customerProjectId} onChange={(e) => setCustomerProjectId(e.target.value)}>
                  <option value="">— Select customer (project) —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="inv-card-header flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ListChecks className="h-4 w-4" />
            Lines (must balance)
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => setLines((ls) => [...ls, { accountId: "", projectId: "", debit: "0", credit: "0", notes: "" }])}>
            <Plus className="h-4 w-4" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
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
              <div className="space-y-1 sm:col-span-4">
                <Label className="text-xs">Project *</Label>
                <Select value={l.projectId} onChange={(e) => updateLine(idx, { projectId: e.target.value })} required>
                  <option value="">— Select project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
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
              <div className="space-y-1 sm:col-span-11">
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
