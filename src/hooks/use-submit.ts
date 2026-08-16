"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Client hook for POSTing a JSON body to an API route, then navigating away.
 */
export function useSubmit(apiPath: string, successPath: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      router.push(successPath);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setLoading(false);
    }
  }

  return { submit, loading, error };
}
