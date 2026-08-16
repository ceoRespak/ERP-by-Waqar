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

export function SubmittalForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/sites/submittals", "/sites/submittals");
  const [f, setF] = useState({ projectId: "", date: "", title: "", category: "", description: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: Number(f.projectId),
      date: f.date || null,
      title: f.title,
      category: f.category || null,
      description: f.description || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Submittal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)} required>
              <option value="">— Select —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={f.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">— Other —</option>
                {["MATERIAL", "DRAWING", "SPECIFICATION", "TEST"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Steel Grade 60 Mill Certificate" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Submittal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
