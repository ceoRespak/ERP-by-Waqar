"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function CostCenterForm({ projectId }: { projectId: number }) {
  const { submit, loading, error } = useSubmit("/api/cost/centers", `/cost?projectId=${projectId}`);
  const [f, setF] = useState({ code: "", name: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ projectId, code: f.code, name: f.name });
    setF({ code: "", name: "" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cost Center</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Code *</Label>
              <Input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="CC-01" required />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Earthworks" required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.code || !f.name} size="sm">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Center
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
