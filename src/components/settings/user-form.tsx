"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function UserForm({ roles }: { roles: { id: number; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/settings/users", "/settings");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", roleIds: [] as number[] });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  function toggleRole(roleId: number) {
    setF((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((r) => r !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      name: f.name,
      email: f.email,
      password: f.password,
      phone: f.phone || null,
      roleIds: f.roleIds,
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
            <Label>Roles *</Label>
            <div className="space-y-1.5">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={f.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || f.roleIds.length === 0} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
