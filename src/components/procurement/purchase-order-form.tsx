"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Line = { itemId: string; description: string; quantity: string; unitPrice: string; taxRate: string };

export function PurchaseOrderForm({
  vendors,
  requisitions,
  projects,
  items,
}: {
  vendors: { id: number; name: string }[];
  requisitions: { id: number; prNo: string; title: string }[];
  projects: { id: number; code: string; name: string }[];
  items: { id: number; code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/procurement/purchase-orders", "/procurement/purchase-orders");

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [requisitionId, setRequisitionId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", description: "", quantity: "1", unitPrice: "0", taxRate: "0" }]);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function handleVendorChange(value: string) {
    setVendorId(value);
    if (value) {
      const v = vendors.find((x) => x.id === Number(value));
      if (v) setVendorName(v.name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vendorId: vendorId || null,
      vendorName: vendorName || (vendorId ? "" : "Cash / General"),
      requisitionId: requisitionId || null,
      projectId: projectId || null,
      expectedDelivery: expectedDelivery || null,
      terms,
      items: lines.map((l) => ({
        itemId: l.itemId ? Number(l.itemId) : null,
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
        taxRate: Number(l.taxRate) || 0,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select value={vendorId} onChange={(e) => handleVendorChange(e.target.value)} required>
              <option value="">— Select vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vendor Name (override)</Label>
            <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Auto-filled from vendor" />
          </div>
          <div className="space-y-2">
            <Label>From Requisition</Label>
            <Select value={requisitionId} onChange={(e) => setRequisitionId(e.target.value)}>
              <option value="">— None —</option>
              {requisitions.map((r) => (
                <option key={r.id} value={r.id}>{r.prNo} — {r.title}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Expected Delivery</Label>
            <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment / Delivery Terms</Label>
            <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Optional" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { itemId: "", description: "", quantity: "1", unitPrice: "0", taxRate: "0" }])}>
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
                <Input value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">Qty *</Label>
                <Input type="number" min="0" step="any" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Unit Price *</Label>
                <Input type="number" min="0" step="any" value={l.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">Tax %</Label>
                <Input type="number" min="0" step="any" value={l.taxRate} onChange={(e) => updateLine(idx, { taxRate: e.target.value })} />
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
          {loading ? "Saving..." : "Save Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
