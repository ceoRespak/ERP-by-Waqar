"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

/**
 * Inline PM→HR approval actions for leaves and attendance.
 * - Leaves: PENDING → PM approves; APPROVED_BY_PM → HR approves
 * - Attendance: pending → PM approves; approved_by_pm → HR approves
 */
export function ApprovalActions({
  kind,
  id,
  status,
  step,
}: {
  kind: "leave" | "attendance";
  id: number;
  status: string;
  step?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve-pm" | "approve-hr" | "reject") {
    setLoading(action);
    setError(null);
    let body: unknown = {};
    if (action === "reject") {
      const reason = window.prompt("Rejection reason:");
      if (reason === null) {
        setLoading(null);
        return;
      }
      body = { reason: reason || "Rejected" };
    }
    try {
      const res = await fetch(`/api/hr/${kind}s/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      setLoading(null);
    }
  }

  const atPmStep = kind === "leave" ? status === "PENDING" : status === "pending";
  const atHrStep = kind === "leave" ? status === "APPROVED_BY_PM" : status === "approved_by_pm";
  const done = kind === "leave" ? status === "APPROVED_BY_HR" || status === "REJECTED" || status === "CANCELLED" : status === "approved_by_hr" || status === "rejected";

  if (done) return null;

  return (
    <div className="flex items-center gap-1.5">
      {atPmStep && (
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!loading} onClick={() => act("approve-pm")}>
            {loading === "approve-pm" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} PM Approve
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" disabled={!!loading} onClick={() => act("reject")}>
            {loading === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Reject
          </Button>
        </>
      )}
      {atHrStep && (
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!loading} onClick={() => act("approve-hr")}>
            {loading === "approve-hr" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} HR Approve
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" disabled={!!loading} onClick={() => act("reject")}>
            {loading === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Reject
          </Button>
        </>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
