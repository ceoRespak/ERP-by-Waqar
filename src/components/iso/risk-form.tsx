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

export function RiskForm({
  projectId,
  projects,
  activities,
}: {
  projectId: number | null;
  projects: { id: number; code: string }[];
  activities: { id: number; wbsCode: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/iso/risks", "/iso");
  const [f, setF] = useState({
    projectId: projectId ? String(projectId) : "",
    activityId: "",
    hazard: "",
    risk: "",
    likelihood: "3",
    severity: "3",
    controlMeasures: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const rating = (Number(f.likelihood) || 1) * (Number(f.severity) || 1);
  const ratingColor = rating >= 15 ? "text-destructive" : rating >= 8 ? "text-amber-600" : "text-emerald-600";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: f.projectId ? Number(f.projectId) : null,
      activityId: f.activityId ? Number(f.activityId) : null,
      hazard: f.hazard,
      risk: f.risk || null,
      likelihood: Number(f.likelihood),
      severity: Number(f.severity),
      controlMeasures: f.controlMeasures || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Project</Label>
              <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)}>
                <option value="">— None —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Activity</Label>
              <Select value={f.activityId} onChange={(e) => set("activityId", e.target.value)}>
                <option value="">— None —</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.wbsCode} — {a.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Hazard *</Label>
            <Input value={f.hazard} onChange={(e) => set("hazard", e.target.value)} placeholder="e.g. Working at height" required />
          </div>
          <div>
            <Label>Risk</Label>
            <Input value={f.risk} onChange={(e) => set("risk", e.target.value)} placeholder="e.g. Fall from scaffold" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Likelihood (1-5)</Label>
              <Input type="number" min={1} max={5} value={f.likelihood} onChange={(e) => set("likelihood", e.target.value)} />
            </div>
            <div>
              <Label>Severity (1-5)</Label>
              <Input type="number" min={1} max={5} value={f.severity} onChange={(e) => set("severity", e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border bg-muted/40 p-2 text-sm">
            Risk Rating: <span className={`font-bold ${ratingColor}`}>{rating}</span>{" "}
            {rating >= 15 ? "(High)" : rating >= 8 ? "(Medium)" : "(Low)"}
          </div>
          <div>
            <Label>Control Measures</Label>
            <Textarea value={f.controlMeasures} onChange={(e) => set("controlMeasures", e.target.value)} placeholder="Mitigations, PPE, permits, etc." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.hazard}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Risk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
