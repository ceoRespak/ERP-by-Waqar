"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function EvaluationForm({ vendors }: { vendors: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/vendors/evaluations", "/vendors/evaluations");
  const [f, setF] = useState({ vendorId: "", date: "", criteria: "QUALITY", score: "5", remarks: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vendorId: Number(f.vendorId),
      date: f.date || null,
      criteria: f.criteria,
      score: Number(f.score),
      remarks: f.remarks || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select value={f.vendorId} onChange={(e) => set("vendorId", e.target.value)} required>
              <option value="">— Select —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Criteria</Label>
            <Select value={f.criteria} onChange={(e) => set("criteria", e.target.value)}>
              {["QUALITY", "PRICE", "DELIVERY", "SERVICE"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Score (1–10)</Label>
            <Input type="number" min="1" max="10" value={f.score} onChange={(e) => set("score", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input value={f.remarks} onChange={(e) => set("remarks", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Evaluation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
