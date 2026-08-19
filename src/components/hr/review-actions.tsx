"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

/** Approve / reject actions for device registrations and face enrollments. */
export function ReviewActions({ kind, id, pending }: { kind: "device" | "face"; id: number; pending: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/hr/${kind === "device" ? "devices" : "face-enrollments"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      setLoading(null);
    }
  }

  if (!pending) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!loading} onClick={() => act("approve")}>
        {loading === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
      </Button>
      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" disabled={!!loading} onClick={() => act("reject")}>
        {loading === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Reject
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
