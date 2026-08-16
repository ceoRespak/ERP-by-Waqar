"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { MODULES, MODULE_LABELS, APPROVAL_ENTITY_TYPES, ENTITY_TYPE_LABELS } from "@/lib/constants";

const ENTITY_TYPES = Object.values(APPROVAL_ENTITY_TYPES);
const MODULE_KEYS = Object.values(MODULES);

type Step = { roleId: string };

export function ApprovalChainForm({ roles }: { roles: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/settings/approval-chains", "/settings/approval-chains");
  const [name, setName] = useState("");
  const [module, setModule] = useState<string>(MODULES.PROCUREMENT);
  const [entityType, setEntityType] = useState<string>(APPROVAL_ENTITY_TYPES.PURCHASE_REQUISITION);
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ roleId: "" }]);

  function updateStep(idx: number, roleId: string) {
    setSteps((s) => s.map((x, i) => (i === idx ? { roleId } : x)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      name,
      module,
      entityType,
      description: description || null,
      steps: steps.map((s, i) => ({ stepOrder: i + 1, roleId: s.roleId ? Number(s.roleId) : null, userId: null })),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Approval Chain</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Chain Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Site Engineer → Project Manager → Finance" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={module} onChange={(e) => setModule(e.target.value)}>
                {MODULE_KEYS.map((m) => (
                  <option key={m} value={m}>{MODULE_LABELS[m]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{ENTITY_TYPE_LABELS[t] ?? t}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Approval Steps (in order)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setSteps((s) => [...s, { roleId: "" }])}>
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">{idx + 1}</span>
                  <Select value={s.roleId} onChange={(e) => updateStep(idx, e.target.value)} required>
                    <option value="">— Approver role —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSteps((st) => st.filter((_, i) => i !== idx))} disabled={steps.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create Chain"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
