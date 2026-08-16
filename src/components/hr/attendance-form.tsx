"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

const STATUSES = ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"];

export function AttendanceForm({ employees }: { employees: { id: number; empCode: string; firstName: string; lastName: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/hr/attendance", "/hr/attendance");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("PRESENT");
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    await submit({
      employeeId: Number(employeeId),
      date,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status,
      notes: notes || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">— Select —</option>
              {employees.map((em) => (
                <option key={em.id} value={em.id}>{em.empCode} — {em.firstName} {em.lastName}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Check In</Label>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check Out</Label>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
