import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listJournalEntries, createJournalEntry } from "@/server/finance/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_READ);
  if (!user) return unauthorized();
  try {
    return ok({ entries: await listJournalEntries() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.description || !body?.lines?.length) return fail("description and lines are required");
  try {
    const record = await createJournalEntry({
      description: body.description,
      date: body.date ?? null,
      createdById: Number(user.id),
      vendorId: body.vendorId ? Number(body.vendorId) : null,
      clientId: body.clientId ? Number(body.clientId) : null,
      lines: body.lines,
    });
    return ok({ entry: record });
  } catch (e) {
    return handleError(e);
  }
}
