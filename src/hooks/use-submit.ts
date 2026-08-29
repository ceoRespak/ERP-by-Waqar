"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Client hook for POSTing a JSON body to an API route, then navigating away.
 * Returns `true` on success (after navigation/refresh) so callers can reset
 * local form state — important when the success page is the SAME page the form
 * lives on (otherwise the submit button stays stuck on "Saving...").
 */
export function useSubmit(apiPath: string, successPath: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: unknown): Promise<boolean> {
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
      setLoading(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setLoading(false);
      return false;
    }
  }

  return { submit, loading, error };
}
