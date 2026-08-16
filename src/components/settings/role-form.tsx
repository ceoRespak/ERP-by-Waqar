"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus } from "lucide-react";

export function RoleForm() {
  const { submit, loading, error } = useSubmit("/api/settings/roles", "/settings/roles");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ name, description: description || null, permissionIds: [] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Role</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Role Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. SITE_ENGINEER" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Creating..." : "Create Role"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
