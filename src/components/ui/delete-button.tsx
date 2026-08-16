"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

/** Issues a DELETE to an API path, then refreshes the current page. */
export function DeleteButton({ apiPath, confirmMessage }: { apiPath: string; confirmMessage?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </span>
  );
}
