"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { COST_TYPES } from "@/lib/constants";
import { Loader2, Plus, Trash2 } from "lucide-react";

type LineInput = { activityId: string; costType: string; amount: string };

export function BudgetForm({ projectId, activities }: { projectId: number; activities: { id: number; wbsCode: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/budget", `/budget?projectId=${projectId}`);
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [lines, setLines] = useState<LineInput[]>([{ activityId: "", costType: "MATERIAL", amount: "" }]);

  function setLine(i: number, patch: Partial<LineInput>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      name,
      period: period || null,
      lines: lines
        .filter((l) => l.amount && Number(l.amount) > 0)
        .map((l) => ({
          activityId: l.activityId ? Number(l.activityId) : null,
          costType: l.costType,
          amount: Number(l.amount),
        })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3">
            <div>
              <Label>Budget Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tower Residency — Main Budget" required />
            </div>
            <div>
              <Label>Period</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. FY2026-27" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Budget Lines</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-5">
                  <Select value={l.activityId} onChange={(e) => setLine(i, { activityId: e.target.value })}>
                    <option value="">— No activity —</option>
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.wbsCode} — {a.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select value={l.costType} onChange={(e) => setLine(i, { costType: e.target.value })}>
                    {COST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input type="number" min={0} step="0.01" value={l.amount} placeholder="PKR" onChange={(e) => setLine(i, { amount: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, { activityId: "", costType: "MATERIAL", amount: "" }])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !name}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? "Creating..." : "Create Budget"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
