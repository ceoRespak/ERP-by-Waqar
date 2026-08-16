"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";

type Props = {
  requestId: number;
  onDone?: () => void;
};

export function ApproveActions({ requestId, onDone }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<null | "APPROVE" | "REJECT">(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "APPROVE" | "REJECT") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.refresh();
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={busy !== null}
          onClick={() => act("REJECT")}
        >
          <X className="h-4 w-4" />
          {busy === "REJECT" ? "Rejecting..." : "Reject"}
        </Button>
        <Button disabled={busy !== null} onClick={() => act("APPROVE")}>
          <Check className="h-4 w-4" />
          {busy === "APPROVE" ? "Approving..." : "Approve"}
        </Button>
      </div>
    </div>
  );
}
