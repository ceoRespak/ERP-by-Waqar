"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CORRESPONDENCE_STATUSES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export function CorrespondenceStatus({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/correspondence/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="inline-flex items-center gap-1">
        <select
          value={status}
          onChange={(e) => change(e.target.value)}
          disabled={busy}
          className="flex h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none disabled:opacity-50"
        >
          {CORRESPONDENCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </div>
  );
}
