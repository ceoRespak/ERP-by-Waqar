"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { COMPETENCY_LEVELS } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function TrainingForm({ employees }: { employees: { id: number; firstName: string; lastName: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/iso/training", "/iso");
  const [f, setF] = useState({
    employeeId: "",
    trainingTitle: "",
    provider: "",
    trainingDate: "",
    expiryDate: "",
    certificateUrl: "",
    competencyLevel: "BASIC",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      employeeId: f.employeeId ? Number(f.employeeId) : null,
      trainingTitle: f.trainingTitle,
      provider: f.provider || null,
      trainingDate: f.trainingDate || null,
      expiryDate: f.expiryDate || null,
      certificateUrl: f.certificateUrl || null,
      competencyLevel: f.competencyLevel,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Training Record</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Employee</Label>
              <Select value={f.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
                <option value="">— None —</option>
                {employees.map((em) => (
                  <option key={em.id} value={em.id}>
                    {em.firstName} {em.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Competency</Label>
              <Select value={f.competencyLevel} onChange={(e) => set("competencyLevel", e.target.value)}>
                {COMPETENCY_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Training Title *</Label>
            <Input value={f.trainingTitle} onChange={(e) => set("trainingTitle", e.target.value)} placeholder="e.g. Scaffold Safety" required />
          </div>
          <div>
            <Label>Provider</Label>
            <Input value={f.provider} onChange={(e) => set("provider", e.target.value)} placeholder="e.g. NEBOSH / internal" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Training Date</Label>
              <Input type="date" value={f.trainingDate} onChange={(e) => set("trainingDate", e.target.value)} />
            </div>
            <div>
              <Label>Certificate Expiry</Label>
              <Input type="date" value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.trainingTitle}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Training"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
