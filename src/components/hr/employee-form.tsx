"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function EmployeeForm({
  departments,
  designations,
  projects,
}: {
  departments: { id: number; name: string }[];
  designations: { id: number; name: string }[];
  projects: { id: number; name: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/hr/employees", "/hr/employees");
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    cnic: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "",
    dateOfBirth: "",
    phone: "",
    emergencyPhone: "",
    email: "",
    employeeType: "permanent",
    departmentId: "",
    designationId: "",
    joiningDate: "",
    contractEndDate: "",
    currentProjectId: "",
    basicSalary: "0",
    hourlyRate: "0",
    dailyWage: "0",
    wht: "0",
    advances: "0",
    bankName: "",
    bankAccount: "",
    systemRole: "employee",
    createUser: false,
    password: "",
  });

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.firstName || !f.lastName) return;
    await submit({
      firstName: f.firstName,
      lastName: f.lastName,
      fatherName: f.fatherName || null,
      cnic: f.cnic || null,
      gender: f.gender || null,
      maritalStatus: f.maritalStatus || null,
      bloodGroup: f.bloodGroup || null,
      dateOfBirth: f.dateOfBirth || null,
      phone: f.phone || null,
      emergencyPhone: f.emergencyPhone || null,
      email: f.email || null,
      employeeType: f.employeeType,
      departmentId: f.departmentId ? Number(f.departmentId) : null,
      designationId: f.designationId ? Number(f.designationId) : null,
      joiningDate: f.joiningDate || null,
      contractEndDate: f.contractEndDate || null,
      currentProjectId: f.currentProjectId ? Number(f.currentProjectId) : null,
      basicSalary: Number(f.basicSalary),
      hourlyRate: Number(f.hourlyRate),
      dailyWage: Number(f.dailyWage),
      wht: Number(f.wht),
      advances: Number(f.advances),
      bankName: f.bankName || null,
      bankAccount: f.bankAccount || null,
      systemRole: f.systemRole,
      createUser: f.createUser,
      password: f.password || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Father Name</Label>
              <Input value={f.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNIC</Label>
              <Input value={f.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="34101-1234567-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select value={f.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">—</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={f.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                <option value="">—</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Employee Type</Label>
              <Select value={f.employeeType} onChange={(e) => set("employeeType", e.target.value)}>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="daily_wages">Daily Wages</option>
                <option value="probation">Probation</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={f.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Select value={f.designationId} onChange={(e) => set("designationId", e.target.value)}>
                <option value="">—</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input type="date" value={f.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contract End</Label>
              <Input type="date" value={f.contractEndDate} onChange={(e) => set("contractEndDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current Project</Label>
              <Select value={f.currentProjectId} onChange={(e) => set("currentProjectId", e.target.value)}>
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Basic Salary</Label>
              <Input type="number" step="any" value={f.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hourly Rate</Label>
              <Input type="number" step="any" value={f.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Daily Wage</Label>
              <Input type="number" step="any" value={f.dailyWage} onChange={(e) => set("dailyWage", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>WHT / Month</Label>
              <Input type="number" step="any" value={f.wht} onChange={(e) => set("wht", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Advances</Label>
              <Input type="number" step="any" value={f.advances} onChange={(e) => set("advances", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bank</Label>
              <Input value={f.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <Input value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
          </div>
          <div className="rounded-md border p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.createUser} onChange={(e) => set("createUser", e.target.checked)} className="h-4 w-4" />
              Create login user
            </label>
            {f.createUser && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>System Role</Label>
                    <Select value={f.systemRole} onChange={(e) => set("systemRole", e.target.value)}>
                      <option value="employee">Employee</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password (blank = auto)</Label>
                    <Input value={f.password} onChange={(e) => set("password", e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Employee"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

