"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

type Props = {
  apiPath: string;
  disabled?: boolean;
  label?: string;
};

/** Submits a record for approval: POST to apiPath then refreshes the page. */
export function SubmitToApprovalButton({ apiPath, disabled, label = "Submit for Approval" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiPath, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      // Reset busy BEFORE refreshing: router.refresh() keeps client state,
      // so leaving it true would leave the button stuck on "Submitting...".
      setBusy(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={handleClick} disabled={disabled || busy} variant="outline" size="sm">
        {busy ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Submitting..." : label}
      </Button>
    </div>
  );
}
