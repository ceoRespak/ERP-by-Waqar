"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";

const ROLES = ["VIEWER", "EDITOR", "APPROVER", "MANAGER"];

export function ProjectTeam({
  projectId,
  members,
  users,
}: {
  projectId: number;
  members: { id: number; userId: number; role: string; user: { id: number; name: string; email: string } }[];
  users: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add member");
      setUserId("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function remove(memberUserId: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberUserId }),
      });
      if (!res.ok) throw new Error("Failed to remove member");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {members.length === 0 && <p className="text-sm text-muted-foreground">No members assigned.</p>}
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
            <span className="font-medium">{m.user.name}</span>
            <Badge variant="secondary">{m.role}</Badge>
            <button onClick={() => remove(m.userId)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Add user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-36">
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Button size="sm" onClick={add} disabled={busy || !userId}>
          {busy ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
