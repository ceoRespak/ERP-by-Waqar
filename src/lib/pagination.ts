/** Parse a 1-based `page` query param (default 1). */
export function parsePage(page?: string): number {
  const n = Number(page);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Build a base href for DataTable pagination, preserving other query params. */
export function buildBaseHref(path: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, v);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
