import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listEmployees, createEmployee } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  try {
    return ok({ employees: await listEmployees() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const user = await apiRequirePermission(PERMISSIONS.HR_CREATE);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.empCode || !body?.firstName || !body?.lastName) return fail("empCode, firstName and lastName are required");
  try {
    const record = await createEmployee({
      empCode: body.empCode,
      firstName: body.firstName,
      lastName: body.lastName,
      cnic: body.cnic ?? null,
      gender: body.gender ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      departmentId: body.departmentId ? Number(body.departmentId) : null,
      designationId: body.designationId ? Number(body.designationId) : null,
      joiningDate: body.joiningDate ?? null,
      basicSalary: body.basicSalary ? Number(body.basicSalary) : 0,
      allowances: body.allowances ? Number(body.allowances) : 0,
      bankName: body.bankName ?? null,
      bankAccount: body.bankAccount ?? null,
    });
    return ok({ employee: record });
  } catch (e) {
    return handleError(e);
  }
}
