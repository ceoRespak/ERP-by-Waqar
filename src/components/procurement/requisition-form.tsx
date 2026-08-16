"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Line = { itemId: string; description: string; quantity: string; unit: string; estimatedCost: string };

export function RequisitionForm({
  departments,
  projects,
  items,
}: {
  departments: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
  items: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/procurement/requisitions", "/procurement/requisitions");

  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", description: "", quantity: "1", unit: "EA", estimatedCost: "0" }]);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      title,
      departmentId: departmentId || null,
      projectId: projectId || null,
      requiredDate: requiredDate || null,
      notes,
      items: lines.map((l) => ({
        itemId: l.itemId ? Number(l.itemId) : null,
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unit: l.unit,
        estimatedCost: Number(l.estimatedCost) || 0,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Cement bags for Site Alpha" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept">Department</Label>
            <Select id="dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— Select —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— Select —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reqdate">Required By</Label>
            <Input id="reqdate" type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((ls) => [...ls, { itemId: "", description: "", quantity: "1", unit: "EA", estimatedCost: "0" }])}
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Item</Label>
                <Select value={l.itemId} onChange={(e) => updateLine(idx, { itemId: e.target.value })}>
                  <option value="">— Free text —</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-4">
                <Label className="text-xs">Description *</Label>
                <Input value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} required placeholder="Material / service description" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">Qty *</Label>
                <Input type="number" min="0" step="any" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">Unit</Label>
                <Input value={l.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Est. Cost</Label>
                <Input type="number" min="0" step="any" value={l.estimatedCost} onChange={(e) => updateLine(idx, { estimatedCost: e.target.value })} />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Saving..." : "Save Requisition"}
        </Button>
      </div>
    </form>
  );
}
