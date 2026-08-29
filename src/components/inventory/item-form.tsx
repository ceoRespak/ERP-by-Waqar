"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, PackagePlus } from "lucide-react";

export function ItemForm({
  categories,
  warehouses,
}: {
  categories: { id: number; name: string }[];
  warehouses: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/inventory/items", "/inventory/items");
  const [form, setForm] = useState({
    code: "",
    name: "",
    categoryId: "",
    unit: "EA",
    reorderLevel: "0",
    openingStock: "0",
    openingWarehouseId: "",
    description: "",
    isInventoryItem: true,
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code: form.code,
      name: form.name,
      categoryId: form.categoryId || null,
      unit: form.unit,
      reorderLevel: Number(form.reorderLevel),
      openingStock: Number(form.openingStock),
      openingWarehouseId: form.openingWarehouseId ? Number(form.openingWarehouseId) : null,
      isInventoryItem: form.isInventoryItem,
      description: form.description || null,
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="inv-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <PackagePlus className="h-4 w-4" />
          New Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Item Code *</Label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} required placeholder="e.g. CEM-001" />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Cement (Ordinary Portland)" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isInventoryItem}
              onChange={(e) => set("isInventoryItem", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Track in inventory (stock){" "}
              <span className="font-normal text-slate-500">— uncheck for services / non-stock items</span>
            </span>
          </label>
          {form.isInventoryItem && (
            <>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" min="0" step="any" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input type="number" min="0" step="any" value={form.openingStock} onChange={(e) => set("openingStock", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Opening Stock Warehouse</Label>
                <Select value={form.openingWarehouseId} onChange={(e) => set("openingWarehouseId", e.target.value)}>
                  <option value="">— First warehouse —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow hover:from-sky-600 hover:to-indigo-700 hover:text-white">
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
