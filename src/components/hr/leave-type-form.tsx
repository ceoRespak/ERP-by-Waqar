"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function LeaveTypeForm() {
  const { submit, loading, error } = useSubmit("/api/hr/leave-types", "/hr/leave-types");
  const [f, setF] = useState({ code: "", name: "", defaultTotal: "0", isPaid: true, requiresDocument: false, sortOrder: "0" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.code || !f.name) return;
    await submit({
      code: f.code,
      name: f.name,
      defaultTotal: Number(f.defaultTotal),
      isPaid: f.isPaid,
      requiresDocument: f.requiresDocument,
      sortOrder: Number(f.sortOrder),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Leave Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} required placeholder="e.g. annual" />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="Annual Leave" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Default Total (days)</Label>
              <Input type="number" step="any" value={f.defaultTotal} onChange={(e) => setF({ ...f, defaultTotal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.isPaid} onChange={(e) => setF({ ...f, isPaid: e.target.checked })} className="h-4 w-4" />
            Paid leave
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.requiresDocument} onChange={(e) => setF({ ...f, requiresDocument: e.target.checked })} className="h-4 w-4" />
            Requires supporting document
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Leave Type"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
