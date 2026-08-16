"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

const LABOR_TYPES = ["LABOUR", "MASON", "CARPENTER", "ELECTRICIAN", "PLUMBER", "STEEL FIXER", "OPERATOR", "OTHER"];

export function LaborForm({
  projectId,
  activities,
}: {
  projectId: number;
  activities: { id: number; wbsCode: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/progress/labor", `/progress?projectId=${projectId}`);
  const [f, setF] = useState({ activityId: "", date: new Date().toISOString().slice(0, 10), laborType: "LABOUR", count: "1", notes: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      activityId: f.activityId ? Number(f.activityId) : null,
      date: f.date,
      laborType: f.laborType,
      count: Number(f.count),
      notes: f.notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Labor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Activity</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={f.activityId} onChange={(e) => set("activityId", e.target.value)}>
                <option value="">— None —</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>{a.wbsCode} — {a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={f.laborType} onChange={(e) => set("laborType", e.target.value)}>
                {LABOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Count *</Label>
              <Input type="number" min="0" value={f.count} onChange={(e) => set("count", e.target.value)} required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Log Labor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
