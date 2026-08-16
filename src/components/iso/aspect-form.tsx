"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { SIGNIFICANCE } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function AspectForm({ projectId, projects }: { projectId: number | null; projects: { id: number; code: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/iso/aspects", "/iso");
  const [f, setF] = useState({
    projectId: projectId ? String(projectId) : "",
    activity: "",
    aspect: "",
    impact: "",
    significance: "LOW",
    controlMeasures: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: f.projectId ? Number(f.projectId) : null,
      activity: f.activity,
      aspect: f.aspect,
      impact: f.impact,
      significance: f.significance,
      controlMeasures: f.controlMeasures || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Environmental Aspect</CardTitle>
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
              <Label>Significance</Label>
              <Select value={f.significance} onChange={(e) => set("significance", e.target.value)}>
                {SIGNIFICANCE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Activity *</Label>
            <Input value={f.activity} onChange={(e) => set("activity", e.target.value)} placeholder="e.g. Concrete batching" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Aspect *</Label>
              <Input value={f.aspect} onChange={(e) => set("aspect", e.target.value)} placeholder="e.g. Dust emissions" required />
            </div>
            <div>
              <Label>Impact *</Label>
              <Input value={f.impact} onChange={(e) => set("impact", e.target.value)} placeholder="e.g. Air pollution" required />
            </div>
          </div>
          <div>
            <Label>Control Measures</Label>
            <Textarea value={f.controlMeasures} onChange={(e) => set("controlMeasures", e.target.value)} placeholder="Water spraying, enclosures, etc." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.activity || !f.aspect || !f.impact}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Aspect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
