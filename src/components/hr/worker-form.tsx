"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export function WorkerForm({ projects }: { projects: { id: number; name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ cnic: "", name: "", fatherName: "", phone: "", projectId: "", dailyWageAmount: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.cnic || !f.name || !f.projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/daily-wages/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic: f.cnic, name: f.name, fatherName: f.fatherName || null, phone: f.phone || null, projectId: Number(f.projectId), dailyWageAmount: f.dailyWageAmount ? Number(f.dailyWageAmount) : 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setF({ cnic: "", name: "", fatherName: "", phone: "", projectId: "", dailyWageAmount: "" });
      setLoading(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Add Daily Wage Worker</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CNIC *</Label>
              <Input value={f.cnic} onChange={(e) => setF({ ...f, cnic: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Father Name</Label>
            <Input value={f.fatherName} onChange={(e) => setF({ ...f, fatherName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Daily Wage Amount</Label>
              <Input type="number" step="any" value={f.dailyWageAmount} onChange={(e) => setF({ ...f, dailyWageAmount: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })} required>
              <option value="">— Select —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />} {loading ? "Saving..." : "Add Worker"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
