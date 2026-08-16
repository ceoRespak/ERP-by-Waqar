"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { CORRESPONDENCE_TYPES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function CorrespondenceForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/correspondence", "/correspondence");
  const [f, setF] = useState({
    type: "LETTER_OUT",
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    fromName: "",
    toName: "",
    subject: "",
    body: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId: f.projectId ? Number(f.projectId) : null,
      type: f.type,
      date: f.date,
      fromName: f.fromName || null,
      toName: f.toName || null,
      subject: f.subject,
      body: f.body || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Correspondence</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type *</Label>
              <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
                {CORRESPONDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
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
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>From</Label>
              <Input value={f.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder={f.type === "LETTER_IN" ? "e.g. Client / Consultant" : "RESPAK (Pvt) Ltd."} />
            </div>
            <div>
              <Label>To</Label>
              <Input value={f.toName} onChange={(e) => set("toName", e.target.value)} placeholder={f.type === "LETTER_IN" ? "RESPAK (Pvt) Ltd." : "e.g. Client / Consultant"} />
            </div>
          </div>
          <div>
            <Label>Subject *</Label>
            <Input value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Subject line" required />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="Letter / memo content" className="min-h-[120px]" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.subject}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Correspondence"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
