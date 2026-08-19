"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    await fetch("/api/hr/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    setLoading(false);
    router.refresh();
  }
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Mark all read
    </Button>
  );
}
