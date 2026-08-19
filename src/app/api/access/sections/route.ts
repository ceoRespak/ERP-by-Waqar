import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/permissions";
import { isSuperAdmin, hasSectionAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { ok, unauthorized, handleError } from "@/lib/api";

/**
 * Section access control — returns which ERP sections the current user may
 * access, optionally scoped to a project.
 * Query: ?projectId=...&sections=vendor_liabilities,customer_ledger,inventory,hr_leave,hr_payroll
 * Returns { access: { section: boolean } } — Super Admin gets all true.
 */
const KNOWN_SECTIONS = ["vendor_liabilities", "customer_ledger", "inventory", "hr_leave", "hr_payroll", "hr_attendance", "payments", "expenses", "procurement", "progress", "boq", "boq_analysis", "purchase_bill"];

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ? Number(searchParams.get("projectId")) : null;
  const wanted = (searchParams.get("sections") ?? "").split(",").filter(Boolean);
  const sections = wanted.length ? wanted : KNOWN_SECTIONS;
  try {
    if (isSuperAdmin(user)) {
      return ok({ access: Object.fromEntries(sections.map((s) => [s, true])) });
    }
    const access: Record<string, boolean> = {};
    for (const s of sections) {
      access[s] = await hasSectionAccess(user, s, projectId);
    }
    return ok({ access, projectId });
  } catch (e) {
    return handleError(e);
  }
}
