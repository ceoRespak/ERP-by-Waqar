"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY"];

export function LeaveForm({
  employees,
  leaveTypes,
}: {
  employees: { id: number; empCode: string; firstName: string; lastName: string }[];
  leaveTypes: { code: string; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/hr/leaves", "/hr/leaves");
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !leaveType) return;
    await submit({
      employeeId: Number(employeeId),
      leaveType,
      fromDate,
      toDate,
      reason,
      isHalfDay,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apply for Leave</CardTitle>
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
          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required>
              <option value="">— Select —</option>
              {leaveTypes.map((t) => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From *</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>To *</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} className="h-4 w-4" />
            Half day
          </label>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Leave Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
