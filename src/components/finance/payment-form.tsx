"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Banknote } from "lucide-react";

export function PaymentForm({ accounts }: { accounts: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/finance/payments", "/finance/payments");
  const [type, setType] = useState("OUT");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [refType, setRefType] = useState("");
  const [refId, setRefId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    await submit({
      type,
      amount: Number(amount),
      method,
      date: date || null,
      accountId: Number(accountId),
      refType: refType || null,
      refId: refId ? Number(refId) : null,
      notes: notes || null,
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="inv-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Banknote className="h-4 w-4" />
          New Payment / Receipt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="OUT">Payment (Out)</option>
                <option value="IN">Receipt (In)</option>
              </Select>
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
            <Label>Amount *</Label>
            <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank / Account *</Label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">— Select —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </Select>
          </div>
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
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow hover:from-emerald-600 hover:to-teal-700 hover:text-white">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
