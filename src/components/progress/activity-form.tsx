"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function ActivityForm({ projectId, activities }: { projectId: number; activities: { id: number; wbsCode: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/progress/activities", `/progress?projectId=${projectId}`);
  const [f, setF] = useState({ wbsCode: "", name: "", unit: "EA", totalQty: "0", parentId: "", startDate: "", endDate: "", status: "PLANNED" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      wbsCode: f.wbsCode,
      name: f.name,
      unit: f.unit,
      totalQty: Number(f.totalQty),
      parentId: f.parentId ? Number(f.parentId) : null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      status: f.status,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>WBS Code *</Label>
            <Input value={f.wbsCode} onChange={(e) => set("wbsCode", e.target.value)} required placeholder="1.2" />
          </div>
          <div className="space-y-2">
            <Label>Parent</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={f.parentId} onChange={(e) => set("parentId", e.target.value)}>
              <option value="">— None —</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.wbsCode} — {a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Foundation Concrete" />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input value={f.unit} onChange={(e) => set("unit", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Total Qty</Label>
            <Input type="number" min="0" step="any" value={f.totalQty} onChange={(e) => set("totalQty", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Add Activity"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
