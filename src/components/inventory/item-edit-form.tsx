"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Pencil } from "lucide-react";

export type ItemEdit = {
  id: number;
  code: string;
  name: string;
  unit: string;
  reorderLevel: number;
  categoryId: number | null;
  description: string | null;
  isActive: boolean;
  isInventoryItem: boolean;
};

export function ItemEditForm({ item, categories }: { item: ItemEdit; categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState(item.unit);
  const [categoryId, setCategoryId] = useState(item.categoryId != null ? String(item.categoryId) : "");
  const [reorderLevel, setReorderLevel] = useState(String(item.reorderLevel));
  const [description, setDescription] = useState(item.description ?? "");
  const [isActive, setIsActive] = useState(item.isActive);
  const [isInventoryItem, setIsInventoryItem] = useState(item.isInventoryItem);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit,
          categoryId: categoryId ? Number(categoryId) : null,
          reorderLevel: Number(reorderLevel || 0),
          description: description || null,
          isActive,
          isInventoryItem,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setLoading(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Update failed");
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="inv-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Pencil className="h-4 w-4" />
          Edit Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={item.code} disabled />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="EA" />
            </div>
            {isInventoryItem && (
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" step="any" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
              </div>
            )}
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={isInventoryItem}
              onChange={(e) => setIsInventoryItem(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Track in inventory (stock){" "}
              <span className="font-normal text-slate-500">— uncheck for services / non-stock items</span>
            </span>
          </label>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Active item
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow hover:from-sky-600 hover:to-indigo-700 hover:text-white">
            {loading ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
