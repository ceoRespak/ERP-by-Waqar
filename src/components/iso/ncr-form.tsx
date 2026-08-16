"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { NCR_SOURCES, NCR_SEVERITY } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function NcrForm({ projectId, projects }: { projectId: number | null; projects: { id: number; code: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/iso/ncrs", "/iso");
  const [f, setF] = useState({ projectId: projectId ? String(projectId) : "", source: "INSPECTION", severity: "MINOR", description: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: f.projectId ? Number(f.projectId) : null,
      source: f.source,
      severity: f.severity,
      description: f.description,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Raise NCR</CardTitle>
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
              <Label>Source</Label>
              <Select value={f.source} onChange={(e) => set("source", e.target.value)}>
                {NCR_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={f.severity} onChange={(e) => set("severity", e.target.value)}>
              {NCR_SEVERITY.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Non-conformance found during inspection/audit" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.description}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Raising..." : "Raise NCR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
