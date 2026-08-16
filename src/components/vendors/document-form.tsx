"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function DocumentForm({ vendors }: { vendors: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/vendors/documents", "/vendors/documents");
  const [f, setF] = useState({ vendorId: "", name: "", type: "", fileUrl: "", expiryDate: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      vendorId: Number(f.vendorId),
      name: f.name,
      type: f.type || null,
      fileUrl: f.fileUrl,
      expiryDate: f.expiryDate || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attach Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select value={f.vendorId} onChange={(e) => set("vendorId", e.target.value)} required>
              <option value="">— Select —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Document Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. NTN Certificate" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">— Other —</option>
              {["NTN", "REGISTRATION", "BANK", "OTHER"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File URL *</Label>
            <Input value={f.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} required placeholder="https://... or /uploads/..." />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input type="date" value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
