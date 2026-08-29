import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listPayments, createPayment } from "@/server/finance/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_READ);
  if (!user) return unauthorized();
  try {
    return ok({ payments: await listPayments() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.amount || !body?.accountId) return fail("amount and accountId are required");
  try {
    const record = await createPayment({
      type: body.type === "IN" ? "IN" : "OUT",
      amount: Number(body.amount),
      method: body.method ?? "CASH",
      date: body.date ?? null,
      accountId: Number(body.accountId),
      counterAccountId: body.counterAccountId ? Number(body.counterAccountId) : 0,
      refType: body.refType ?? null,
      refId: body.refId ? Number(body.refId) : null,
      notes: body.notes ?? null,
      createdById: Number(user.id),
    });
    return ok({ payment: record });
  } catch (e) {
    return handleError(e);
  }
}
