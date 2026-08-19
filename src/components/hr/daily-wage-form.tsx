"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export function DailyWageForm({ projects }: { projects: { id: number; name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ cnic: "", projectId: "", date: new Date().toISOString().slice(0, 10), checkIn: "08:00", checkOut: "17:00", amount: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.cnic || !f.projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/daily-wages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnic: f.cnic,
          projectId: Number(f.projectId),
          date: f.date,
          checkIn: f.checkIn || null,
          checkOut: f.checkOut || null,
          amount: f.amount ? Number(f.amount) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setF((prev) => ({ ...prev, cnic: "" }));
      setLoading(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Mark Daily Wage Attendance</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>CNIC *</Label>
            <Input value={f.cnic} onChange={(e) => setF({ ...f, cnic: e.target.value })} required placeholder="34101-1234567-1" />
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
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>In</Label>
              <Input type="time" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Out</Label>
              <Input type="time" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Daily Wage Amount</Label>
            <Input type="number" step="any" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />} {loading ? "Saving..." : "Mark Attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
