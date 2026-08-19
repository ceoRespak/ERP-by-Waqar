"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

/** Step 1 — create a user with basic profile only (no roles/permissions). */
export function UserForm() {
  const { submit, loading, error } = useSubmit("/api/settings/users", "/settings/users");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !f.email || !f.password) return;
    await submit({
      name: f.name,
      email: f.email,
      password: f.password,
      phone: f.phone || null,
      roleIds: [],
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Password *</Label>
            <Input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Next step: open the user and assign projects + per-project permissions.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />} {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
