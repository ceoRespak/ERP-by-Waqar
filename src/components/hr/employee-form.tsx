"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2 } from "lucide-react";

export function EmployeeForm({
  departments,
  designations,
}: {
  departments: { id: number; name: string }[];
  designations: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/hr/employees", "/hr/employees");
  const [f, setF] = useState({
    empCode: "",
    firstName: "",
    lastName: "",
    cnic: "",
    gender: "",
    phone: "",
    email: "",
    departmentId: "",
    designationId: "",
    joiningDate: "",
    basicSalary: "0",
    allowances: "0",
    bankName: "",
    bankAccount: "",
  });

  function set<K extends keyof typeof f>(key: K, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      empCode: f.empCode,
      firstName: f.firstName,
      lastName: f.lastName,
      cnic: f.cnic || null,
      gender: f.gender || null,
      phone: f.phone || null,
      email: f.email || null,
      departmentId: f.departmentId ? Number(f.departmentId) : null,
      designationId: f.designationId ? Number(f.designationId) : null,
      joiningDate: f.joiningDate || null,
      basicSalary: Number(f.basicSalary),
      allowances: Number(f.allowances),
      bankName: f.bankName || null,
      bankAccount: f.bankAccount || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Emp Code *</Label>
            <Input value={f.empCode} onChange={(e) => set("empCode", e.target.value)} required placeholder="EMP-001" />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={f.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>First Name *</Label>
            <Input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Last Name *</Label>
            <Input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>CNIC</Label>
            <Input value={f.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="12345-1234567-1" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={f.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
              <option value="">— Select —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Select value={f.designationId} onChange={(e) => set("designationId", e.target.value)}>
              <option value="">— Select —</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Joining Date</Label>
            <Input type="date" value={f.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Basic Salary (PKR)</Label>
            <Input type="number" min="0" step="any" value={f.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Allowances (PKR)</Label>
            <Input type="number" min="0" step="any" value={f.allowances} onChange={(e) => set("allowances", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input value={f.bankName} onChange={(e) => set("bankName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <Input value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
