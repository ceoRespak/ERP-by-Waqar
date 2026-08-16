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

export function TransmittalForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/sites/transmittals", "/sites/transmittals");
  const [f, setF] = useState({ projectId: "", date: "", subject: "", receiverName: "", receiverOrg: "", description: "", status: "SENT" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: Number(f.projectId),
      date: f.date || null,
      subject: f.subject,
      receiverName: f.receiverName || null,
      receiverOrg: f.receiverOrg || null,
      description: f.description || null,
      status: f.status,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Transmittal</CardTitle>
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
              <Label>Status</Label>
              <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
                {["DRAFT", "SENT", "RECEIVED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input value={f.subject} onChange={(e) => set("subject", e.target.value)} required placeholder="e.g. Submission of shop drawings — Slab S1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Receiver Name</Label>
              <Input value={f.receiverName} onChange={(e) => set("receiverName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Receiver Org</Label>
              <Input value={f.receiverOrg} onChange={(e) => set("receiverOrg", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Transmittal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
