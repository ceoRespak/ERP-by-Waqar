"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function ClientForm() {
  const { submit, loading, error } = useSubmit("/api/clients", "/clients");
  const [f, setF] = useState({ code: "", name: "", type: "CORPORATE", contactPerson: "", phone: "", email: "", city: "", ntn: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code: f.code,
      name: f.name,
      type: f.type,
      contactPerson: f.contactPerson || null,
      phone: f.phone || null,
      email: f.email || null,
      city: f.city || null,
      ntn: f.ntn || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client Code *</Label>
            <Input value={f.code} onChange={(e) => set("code", e.target.value)} required placeholder="CLI-001" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
              {["CORPORATE", "INDIVIDUAL", "GOVERNMENT", "OTHER"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. ABC Developers (Pvt) Ltd." />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>NTN</Label>
            <Input value={f.ntn} onChange={(e) => set("ntn", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
