"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { DOCUMENT_MODULES, ISO_STANDARDS, DOCUMENT_TYPES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function DocumentForm({
  projectId,
  categories,
  nextCode,
}: {
  projectId: number | null;
  categories: { id: number; code: string; name: string; type: string; module: string }[];
  nextCode: string;
}) {
  const { submit, loading, error } = useSubmit("/api/documents", "/documents");
  const [f, setF] = useState({
    docCode: nextCode,
    title: "",
    categoryId: "",
    module: "QUALITY",
    isoStandard: "NONE",
    description: "",
    effectiveDate: "",
    expiryDate: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      docCode: f.docCode,
      title: f.title,
      categoryId: f.categoryId ? Number(f.categoryId) : null,
      module: f.module,
      isoStandard: f.isoStandard,
      description: f.description || null,
      effectiveDate: f.effectiveDate || null,
      expiryDate: f.expiryDate || null,
      projectId,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Register Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Doc Code *</Label>
              <Input value={f.docCode} onChange={(e) => set("docCode", e.target.value)} placeholder="RES/QMS/PRC/001" required />
            </div>
            <div>
              <Label>Module</Label>
              <Select value={f.module} onChange={(e) => set("module", e.target.value)}>
                {DOCUMENT_MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Procurement Procedure" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Category</Label>
              <Select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>ISO Standard</Label>
              <Select value={f.isoStandard} onChange={(e) => set("isoStandard", e.target.value)}>
                {ISO_STANDARDS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Scope and purpose of the document" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={f.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.docCode || !f.title}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Register Document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
