"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { DOCUMENT_MODULES, DOCUMENT_TYPES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";

export function CategoryForm() {
  const router = useRouter();
  const { submit, loading, error } = useSubmit("/api/documents/categories", "/documents");
  const [f, setF] = useState({ code: "", name: "", type: "PROCEDURE", module: "QUALITY", description: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code: f.code,
      name: f.name,
      type: f.type,
      module: f.module,
      description: f.description || null,
    });
    setF({ code: "", name: "", type: "PROCEDURE", module: "QUALITY", description: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Document Category</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Code *</Label>
              <Input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="PRC" required />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Procedures" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.code || !f.name} size="sm">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Category
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
