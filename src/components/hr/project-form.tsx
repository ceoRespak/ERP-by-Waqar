"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function ProjectForm({
  employees,
}: {
  employees: { id: number; firstName: string; lastName: string }[];
}) {
  const { submit, loading, error } = useSubmit("/api/hr/projects", "/hr/projects");
  const [f, setF] = useState({
    name: "",
    code: "",
    projectType: "site",
    status: "planned",
    startDate: "",
    expectedEndDate: "",
    locationAddress: "",
    locationCity: "",
    locationProvince: "",
    locationLat: "",
    locationLng: "",
    allowedRadius: "100",
    shiftType: "morning",
    budget: "0",
    projectManagerId: "",
    siteSupervisorId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !f.startDate) return;
    await submit({
      name: f.name,
      code: f.code || undefined,
      projectType: f.projectType,
      status: f.status,
      startDate: f.startDate,
      expectedEndDate: f.expectedEndDate || null,
      locationAddress: f.locationAddress || null,
      locationCity: f.locationCity || null,
      locationProvince: f.locationProvince || null,
      locationLat: f.locationLat ? Number(f.locationLat) : null,
      locationLng: f.locationLng ? Number(f.locationLng) : null,
      allowedRadius: Number(f.allowedRadius),
      shiftType: f.shiftType,
      budget: Number(f.budget),
      projectManagerId: f.projectManagerId ? Number(f.projectManagerId) : null,
      siteSupervisorId: f.siteSupervisorId ? Number(f.siteSupervisorId) : null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Project / Site</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Code (auto if blank)</Label>
              <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="PRJ0003" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={f.projectType} onChange={(e) => setF({ ...f, projectType: e.target.value })}>
                <option value="head_office">Head Office</option>
                <option value="field_office">Field Office</option>
                <option value="site">Site</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Expected End</Label>
              <Input type="date" value={f.expectedEndDate} onChange={(e) => setF({ ...f, expectedEndDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={f.locationAddress} onChange={(e) => setF({ ...f, locationAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={f.locationCity} onChange={(e) => setF({ ...f, locationCity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Input value={f.locationProvince} onChange={(e) => setF({ ...f, locationProvince: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input type="number" step="any" value={f.locationLat} onChange={(e) => setF({ ...f, locationLat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input type="number" step="any" value={f.locationLng} onChange={(e) => setF({ ...f, locationLng: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>GPS Radius (m)</Label>
              <Input type="number" value={f.allowedRadius} onChange={(e) => setF({ ...f, allowedRadius: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={f.shiftType} onChange={(e) => setF({ ...f, shiftType: e.target.value })}>
                <option value="morning">Morning (09:00–18:00)</option>
                <option value="evening">Evening (14:00–22:00)</option>
                <option value="night">Night (22:00–06:00)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input type="number" step="any" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project Manager</Label>
              <Select value={f.projectManagerId} onChange={(e) => setF({ ...f, projectManagerId: e.target.value })}>
                <option value="">— None —</option>
                {employees.map((em) => (
                  <option key={em.id} value={em.id}>{em.firstName} {em.lastName}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site Supervisor</Label>
              <Select value={f.siteSupervisorId} onChange={(e) => setF({ ...f, siteSupervisorId: e.target.value })}>
                <option value="">— None —</option>
                {employees.map((em) => (
                  <option key={em.id} value={em.id}>{em.firstName} {em.lastName}</option>
                ))}
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Create Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
