"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Plus, BookOpen } from "lucide-react";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;

export function AccountForm({ accounts }: { accounts: { id: number; code: string; name: string }[] }) {
  const { submit, loading, error } = useSubmit("/api/finance/accounts", "/finance/accounts");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("ASSET");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ code, name, type, parentId: parentId || null, description: description || null });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="fin-card-header">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <BookOpen className="h-4 w-4" />
          New Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="1000" />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Cash on Hand" />
          </div>
          <div className="space-y-2">
            <Label>Parent Account</Label>
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— None —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow hover:from-sky-600 hover:to-blue-700 hover:text-white">
            {loading ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Saving..." : "Add Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
