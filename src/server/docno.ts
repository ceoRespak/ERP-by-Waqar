/**
 * Generate sequential document numbers like PR-2026-0001.
 * Safe enough for an ERP scaffold; use a DB sequence for high concurrency.
 */
export async function nextDocNo(
  field: string,
  prefix: string,
  findFirst: (args: any) => Promise<any>
): Promise<string> {
  const year = new Date().getFullYear();
  const last = await findFirst({
    where: { [field]: { startsWith: `${prefix}-${year}-` } },
    orderBy: { [field]: "desc" },
  });
  let seq = 0;
  if (last && last[field]) {
    const parts = String(last[field]).split("-");
    const lastPart = parts[parts.length - 1];
    seq = parseInt(lastPart, 10) || 0;
  }
  return `${prefix}-${year}-${String(seq + 1).padStart(4, "0")}`;
}
