"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

type Activity = { id: number; wbsCode: string; name: string; totalQty: number };

export function ProgressForm({ projectId, activities }: { projectId: number; activities: Activity[] }) {
  const router = useRouter();
  const [activityId, setActivityId] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [plannedQty, setPlannedQty] = useState("0");
  const [actualQty, setActualQty] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = activities.find((a) => a.id === Number(activityId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/progress/activities/${activityId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportDate, plannedQty: Number(plannedQty) || 0, actualQty: Number(actualQty) || 0, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record progress");
      setActualQty("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record progress");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Daily Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Activity *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              required
            >
              <option value="">— Select activity —</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.wbsCode} — {a.name} (total {a.totalQty})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Planned Qty</Label>
              <Input type="number" min="0" step="any" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Actual Qty *</Label>
              <Input type="number" min="0" step="any" value={actualQty} onChange={(e) => setActualQty(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || !selected} className="w-full">
            {busy ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {busy ? "Saving..." : "Record Progress"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
