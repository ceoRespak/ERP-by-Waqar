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

export function DprForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/sites/dpr", "/sites/dpr");
  const [f, setF] = useState({
    projectId: "",
    reportDate: new Date().toISOString().slice(0, 10),
    weather: "",
    workDone: "",
    manpower: "",
    equipment: "",
    materialReceived: "",
    issues: "",
    nextPlan: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: Number(f.projectId),
      reportDate: f.reportDate,
      weather: f.weather || null,
      workDone: f.workDone,
      manpower: f.manpower || null,
      equipment: f.equipment || null,
      materialReceived: f.materialReceived || null,
      issues: f.issues || null,
      nextPlan: f.nextPlan || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New DPR</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)} required>
                <option value="">— Select —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input type="date" value={f.reportDate} onChange={(e) => set("reportDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weather</Label>
            <Input value={f.weather} onChange={(e) => set("weather", e.target.value)} placeholder="e.g. Clear / Rainy" />
          </div>
          <div className="space-y-2">
            <Label>Work Done Today *</Label>
            <Textarea value={f.workDone} onChange={(e) => set("workDone", e.target.value)} required rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Manpower</Label>
              <Input value={f.manpower} onChange={(e) => set("manpower", e.target.value)} placeholder="e.g. 25 labour, 3 masons" />
            </div>
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Input value={f.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="e.g. 1 excavator, 2 mixers" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Material Received</Label>
            <Input value={f.materialReceived} onChange={(e) => set("materialReceived", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Issues / Hurdles</Label>
            <Textarea value={f.issues} onChange={(e) => set("issues", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Next Day Plan</Label>
            <Textarea value={f.nextPlan} onChange={(e) => set("nextPlan", e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save DPR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
