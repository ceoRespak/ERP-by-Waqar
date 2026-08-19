import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listClientInvoices, createClientInvoice } from "@/server/finance/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_READ);
  if (!user) return unauthorized();
  try {
    return ok({ invoices: await listClientInvoices() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_CREATE, body?.projectId ? Number(body.projectId) : null);
  if (!user) return unauthorized();
  if (!body?.clientId || !body?.lines?.length) return fail("clientId and lines are required");
  try {
    const record = await createClientInvoice({
      clientId: Number(body.clientId),
      projectId: body.projectId ? Number(body.projectId) : null,
      date: body.date ?? null,
      dueDate: body.dueDate ?? null,
      taxRate: body.taxRate ? Number(body.taxRate) : 0,
      notes: body.notes ?? null,
      createdById: Number(user.id),
      lines: body.lines,
    });
    return ok({ invoice: record });
  } catch (e) {
    return handleError(e);
  }
}
