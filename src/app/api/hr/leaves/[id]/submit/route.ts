import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { fail, unauthorized } from "@/lib/api";

// Superseded by the native PM → HR approval flow (see /api/hr/leaves/[id]/approve-pm etc.)
export async function POST() {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  return fail("Leave requests use the native PM → HR approval flow — no separate submit step.");
}
