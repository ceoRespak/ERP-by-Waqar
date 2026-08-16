"use client";

import { useEffect, useState } from "react";

/**
 * Shows the count of approval requests waiting on the current user.
 * Rendered in the sidebar next to the Approvals link.
 */
export function PendingApprovalsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch("/api/approvals?scope=pending")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && data?.requests?.length) setCount(data.requests.length);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
      {count}
    </span>
  );
}
