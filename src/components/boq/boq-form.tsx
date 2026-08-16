"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function BoqForm({ projects }: { projects: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/boq", "/boq");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("1.0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ projectId: Number(projectId), title, version });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New BOQ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">— Select project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Main Works BOQ" />
          </div>
          <div className="space-y-2">
            <Label>Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create BOQ"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
