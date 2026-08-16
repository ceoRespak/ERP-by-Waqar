"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function VariationForm({ projectId }: { projectId: number }) {
  const { submit, loading, error } = useSubmit("/api/cost/variations", `/cost?projectId=${projectId}`);
  const [f, setF] = useState({ title: "", description: "", amount: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      title: f.title,
      description: f.description || null,
      amount: Number(f.amount),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Variation Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Extra excavation beyond contract" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Scope, reason and impact of the variation" />
          </div>
          <div>
            <Label>Amount (PKR) *</Label>
            <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.title || !f.amount}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create VO"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
