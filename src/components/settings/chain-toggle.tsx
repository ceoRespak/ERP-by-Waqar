"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";

export function ChainToggle({ chainId, isActive }: { chainId: number; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/settings/approval-chains/${chainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={isActive ? "outline" : "default"} size="sm" onClick={toggle} disabled={busy}>
      <Power className="h-3.5 w-3.5" />
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
