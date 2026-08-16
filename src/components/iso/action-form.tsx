"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { ACTION_TYPES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function ActionForm({ ncrId, employees }: { ncrId: number; employees: { id: number; firstName: string; lastName: string }[] }) {
  const { submit, loading, error } = useSubmit(`/api/iso/ncrs/${ncrId}/actions`, `/iso/ncrs/${ncrId}`);
  const [f, setF] = useState({ type: "CORRECTIVE", title: "", rootCause: "", action: "", responsibleId: "", targetDate: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      type: f.type,
      title: f.title,
      rootCause: f.rootCause || null,
      action: f.action,
      responsibleId: f.responsibleId ? Number(f.responsibleId) : null,
      targetDate: f.targetDate || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Corrective / Preventive Action</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Responsible</Label>
              <Select value={f.responsibleId} onChange={(e) => set("responsibleId", e.target.value)}>
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
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Retrain welding crew" required />
          </div>
          <div>
            <Label>Root Cause</Label>
            <Input value={f.rootCause} onChange={(e) => set("rootCause", e.target.value)} placeholder="e.g. Inadequate weld inspection" />
          </div>
          <div>
            <Label>Action *</Label>
            <Textarea value={f.action} onChange={(e) => set("action", e.target.value)} placeholder="Detailed corrective/preventive action" required />
          </div>
          <div>
            <Label>Target Date</Label>
            <Input type="date" value={f.targetDate} onChange={(e) => set("targetDate", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.title || !f.action}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Action"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
