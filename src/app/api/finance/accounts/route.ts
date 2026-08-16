import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listAccounts, createAccount } from "@/server/finance/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_READ);
  if (!user) return unauthorized();
  try {
    return ok({ accounts: await listAccounts() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.FINANCE_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name || !body?.type) return fail("code, name and type are required");
  try {
    return ok({
      account: await createAccount({
        code: body.code,
        name: body.name,
        type: body.type,
        parentId: body.parentId ? Number(body.parentId) : null,
        description: body.description ?? null,
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}
