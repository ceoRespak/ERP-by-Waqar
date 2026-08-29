"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { cn, formatMoney } from "@/lib/utils";
import { Loader2, Banknote, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function PaymentForm({ accounts }: { accounts: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/finance/payments", "/finance/payments");
  const [type, setType] = useState("OUT");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [counterAccountId, setCounterAccountId] = useState("");
  const [refType, setRefType] = useState("");
  const [refId, setRefId] = useState("");
  const [notes, setNotes] = useState("");

  const cashAccount = accounts.find((a) => a.id === Number(accountId));
  const crossAccount = accounts.find((a) => a.id === Number(counterAccountId));
  const isOut = type === "OUT";
  const debitAccount = isOut ? crossAccount : cashAccount;
  const creditAccount = isOut ? cashAccount : crossAccount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !counterAccountId) return;
    await submit({
      type,
      amount: Number(amount),
      method,
      date: date || null,
      accountId: Number(accountId),
      counterAccountId: Number(counterAccountId),
      refType: refType || null,
      refId: refId ? Number(refId) : null,
      notes: notes || null,
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="fin-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <Banknote className="h-4 w-4" />
          New Payment / Receipt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("OUT")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                    type === "OUT"
                      ? "border-rose-500 bg-gradient-to-r from-rose-500 to-red-600 text-white shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Payment (Out)
                </button>
                <button
                  type="button"
                  onClick={() => setType("IN")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                    type === "IN"
                      ? "border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Receipt (In)
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                {["CASH", "BANK", "CHEQUE", "ONLINE", "OTHER"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amount (PKR) *</Label>
            <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cash / Bank Account *</Label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">— Select —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cross Account (other side) *</Label>
            <Select value={counterAccountId} onChange={(e) => setCounterAccountId(e.target.value)} required>
              <option value="">— Select cross account —</option>
              {accounts
                .filter((a) => a.id !== Number(accountId))
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {isOut
                ? "Where the money goes (e.g. Accounts Payable / expense for a supplier)."
                : "Where the money comes from (e.g. Accounts Receivable / income from a customer)."}
            </p>
          </div>

          {/* Double-entry preview */}
          {(accountId || counterAccountId) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Banknote className="h-3.5 w-3.5" />
                Double entry preview
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div className="rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs text-muted-foreground">Debit</p>
                  <p className="truncate font-medium text-slate-800">{debitAccount ? `${debitAccount.code} — ${debitAccount.name}` : "—"}</p>
                  <p className="text-right text-sm font-semibold text-rose-600">{formatMoney(Number(amount) || 0)}</p>
                </div>
                <div className="rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs text-muted-foreground">Credit</p>
                  <p className="truncate font-medium text-slate-800">{creditAccount ? `${creditAccount.code} — ${creditAccount.name}` : "—"}</p>
                  <p className="text-right text-sm font-semibold text-emerald-600">{formatMoney(Number(amount) || 0)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Reference Type</Label>
              <Input value={refType} onChange={(e) => setRefType(e.target.value)} placeholder="e.g. SUPPLIER_INVOICE" />
            </div>
            <div className="space-y-2">
              <Label>Reference ID</Label>
              <Input value={refId} onChange={(e) => setRefId(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !counterAccountId}
            className={`w-full bg-gradient-to-r text-white shadow hover:text-white ${
              type === "IN"
                ? "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                : "from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : type === "IN" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            {loading ? "Saving..." : type === "IN" ? "Save Receipt (In)" : "Save Payment (Out)"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
