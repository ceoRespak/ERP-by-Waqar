"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { INCIDENT_TYPES, INCIDENT_SEVERITY } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function IncidentForm({
  projectId,
  projects,
  employees,
}: {
  projectId: number | null;
  projects: { id: number; code: string }[];
  employees: { id: number; firstName: string; lastName: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/iso/incidents", "/iso");
  const [f, setF] = useState({
    projectId: projectId ? String(projectId) : "",
    incidentType: "NEAR_MISS",
    severity: "MINOR",
    description: "",
    injuredEmployeeId: "",
    rootCause: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: f.projectId ? Number(f.projectId) : null,
      incidentType: f.incidentType,
      severity: f.severity,
      description: f.description,
      injuredEmployeeId: f.injuredEmployeeId ? Number(f.injuredEmployeeId) : null,
      rootCause: f.rootCause || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Report Safety Incident</CardTitle>
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
              <Label>Type</Label>
              <Select value={f.incidentType} onChange={(e) => set("incidentType", e.target.value)}>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Severity</Label>
              <Select value={f.severity} onChange={(e) => set("severity", e.target.value)}>
                {INCIDENT_SEVERITY.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Injured Employee</Label>
              <Select value={f.injuredEmployeeId} onChange={(e) => set("injuredEmployeeId", e.target.value)}>
                <option value="">— None —</option>
                {employees.map((em) => (
                  <option key={em.id} value={em.id}>
                    {em.firstName} {em.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What happened, where, when" required />
          </div>
          <div>
            <Label>Root Cause (if known)</Label>
            <Input value={f.rootCause} onChange={(e) => set("rootCause", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.description}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Report Incident"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
