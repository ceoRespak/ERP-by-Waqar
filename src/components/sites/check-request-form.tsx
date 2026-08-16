"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function CheckRequestForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/sites/check-requests", "/sites/check-requests");
  const [f, setF] = useState({ projectId: "", date: "", amount: "", payeeName: "", payeeType: "OTHER", description: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: Number(f.projectId),
      date: f.date || null,
      amount: Number(f.amount),
      payeeName: f.payeeName,
      payeeType: f.payeeType,
      description: f.description,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Check Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)} required>
              <option value="">— Select —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (PKR) *</Label>
              <Input type="number" min="0" step="any" value={f.amount} onChange={(e) => set("amount", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Payee Name *</Label>
              <Input value={f.payeeName} onChange={(e) => set("payeeName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Payee Type</Label>
              <Select value={f.payeeType} onChange={(e) => set("payeeType", e.target.value)}>
                {["VENDOR", "EMPLOYEE", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} required rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Check Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
