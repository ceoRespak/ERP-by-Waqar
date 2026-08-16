"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function IpcLineForm({
  ipcId,
  boqItems,
}: {
  ipcId: number;
  boqItems: { id: number; itemCode: string; description: string }[];
}) {
  const router = useRouter();
  const { submit, loading, error } = useSubmit(`/api/cost/ipcs/${ipcId}/lines`, `/cost/ipcs/${ipcId}`);
  const [f, setF] = useState({ boqItemId: "", description: "", currentQty: "", rate: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      boqItemId: f.boqItemId ? Number(f.boqItemId) : null,
      description: f.description,
      currentQty: Number(f.currentQty) || 0,
      rate: Number(f.rate) || 0,
    });
    setF({ boqItemId: "", description: "", currentQty: "", rate: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[220px] flex-1">
        <Select value={f.boqItemId} onChange={(e) => set("boqItemId", e.target.value)}>
          <option value="">— BOQ item —</option>
          {boqItems.map((b) => (
            <option key={b.id} value={b.id}>
              {b.itemCode} — {b.description}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-[200px] flex-1">
        <Input value={f.description} placeholder="Description" onChange={(e) => set("description", e.target.value)} />
      </div>
      <Input type="number" min={0} value={f.currentQty} placeholder="Qty" className="w-24" onChange={(e) => set("currentQty", e.target.value)} />
      <Input type="number" min={0} step="0.01" value={f.rate} placeholder="Rate" className="w-28" onChange={(e) => set("rate", e.target.value)} />
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !f.description}>
        {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
        Add Line
      </Button>
    </form>
  );
}
