"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, Trash2 } from "lucide-react";

type LineInput = { itemId: string; description: string; quantity: string; unit: string };

export function MaterialRequestForm({
  projectId,
  activities,
  items,
}: {
  projectId: number;
  activities: { id: number; wbsCode: string; name: string }[];
  items: { id: number; code: string; name: string; unit: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/materials/requests", `/materials?projectId=${projectId}`);
  const [f, setF] = useState({
    activityId: "",
    requiredDate: "",
    notes: "",
    lines: [{ itemId: "", description: "", quantity: "", unit: "EA" }] as LineInput[],
  });

  function setLine(i: number, patch: Partial<LineInput>) {
    setF((prev) => ({ ...prev, lines: prev.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      projectId,
      activityId: f.activityId ? Number(f.activityId) : null,
      requiredDate: f.requiredDate || null,
      notes: f.notes || null,
      items: f.lines
        .filter((l) => l.description && Number(l.quantity) > 0)
        .map((l) => ({
          itemId: l.itemId ? Number(l.itemId) : null,
          description: l.description,
          quantity: Number(l.quantity),
          unit: l.unit || "EA",
        })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Material Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Activity</Label>
              <Select value={f.activityId} onChange={(e) => setF((p) => ({ ...p, activityId: e.target.value }))}>
                <option value="">— None —</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.wbsCode} — {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Required By</Label>
              <Input type="date" value={f.requiredDate} onChange={(e) => setF((p) => ({ ...p, requiredDate: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Request Lines</Label>
            {f.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-4">
                  <Select value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}>
                    <option value="">— Item —</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.code} — {it.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input value={l.description} placeholder="Description" onChange={(e) => setLine(i, { description: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Input type="number" min={0} step="0.01" value={l.quantity} placeholder="Qty" onChange={(e) => setLine(i, { quantity: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Input value={l.unit} placeholder="Unit" onChange={(e) => setLine(i, { unit: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setF((p) => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setF((p) => ({ ...p, lines: [...p.lines, { itemId: "", description: "", quantity: "", unit: "EA" }] }))}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} placeholder="Delivery instructions, urgency, etc." />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || f.lines.filter((l) => l.description).length === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
