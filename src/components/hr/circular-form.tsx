"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Megaphone } from "lucide-react";

const ROLES = ["admin", "hr_manager", "project_manager", "employee"];

export function CircularForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", message: "", priority: "normal", targetRoles: ["employee"] as string[] });

  function toggleRole(r: string) {
    setF((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(r) ? prev.targetRoles.filter((x) => x !== r) : [...prev.targetRoles, r],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title || !f.message) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/circulars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: f.title, message: f.message, priority: f.priority, targetRoles: f.targetRoles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setF({ title: "", message: "", priority: "normal", targetRoles: ["employee"] });
      setLoading(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create Circular</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs">
                  <input type="checkbox" checked={f.targetRoles.includes(r)} onChange={() => toggleRole(r)} className="h-3.5 w-3.5" />
                  {r.replace("_", " ")}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Megaphone className="h-4 w-4" />} {loading ? "Publishing..." : "Publish Circular"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
