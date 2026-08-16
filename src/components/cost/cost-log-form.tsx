"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { COST_TYPES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function CostLogForm({
  projectId,
  costCenters,
}: {
  projectId: number;
  costCenters: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/cost/logs", `/cost?projectId=${projectId}`);
  const [f, setF] = useState({
    costCenterId: "",
    date: new Date().toISOString().slice(0, 10),
    costType: "MATERIAL",
    description: "",
    amount: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      costCenterId: f.costCenterId ? Number(f.costCenterId) : null,
      date: f.date,
      costType: f.costType,
      description: f.description,
      amount: Number(f.amount),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Cost</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3">
            <div>
              <Label>Description *</Label>
              <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Cement consignment (truck no LEC-5678)" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div>
                <Label>Cost Type</Label>
                <Select value={f.costType} onChange={(e) => set("costType", e.target.value)}>
                  {COST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cost Center</Label>
                <Select value={f.costCenterId} onChange={(e) => set("costCenterId", e.target.value)}>
                  <option value="">— None —</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Amount (PKR) *</Label>
                <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.description || !f.amount}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Logging..." : "Log Cost"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
