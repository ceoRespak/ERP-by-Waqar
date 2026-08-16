import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date as YYYY-MM-DD (local) for input[type=date] */
export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a number with 2 decimal places (accepts Prisma Decimal too) */
export function formatMoney(n: unknown): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

/** Format a number (no forced decimals) */
export function formatNumber(n: unknown): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-PK").format(v);
}

/** Format a Date as a readable string */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Generate a sequential document number, e.g. PR-2026-0001 */
export function generateDocNo(prefix: string, seq: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${prefix}-${y}-${String(seq).padStart(4, "0")}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
