import { NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getEmployeeDetail, updateEmployee, deleteEmployee } from "@/server/hr/service";
import { ok, fail, unauthorized, handleError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_READ);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const employee = await getEmployeeDetail(Number(id));
    if (!employee) return fail("Employee not found", 404);
    return ok({ employee });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_UPDATE);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid request body");
  try {
    const employee = await updateEmployee(Number(id), {
      firstName: body.firstName,
      lastName: body.lastName,
      fatherName: body.fatherName ?? null,
      cnic: body.cnic ?? null,
      gender: body.gender ?? null,
      maritalStatus: body.maritalStatus ?? null,
      bloodGroup: body.bloodGroup ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      phone: body.phone ?? null,
      emergencyPhone: body.emergencyPhone ?? null,
      email: body.email ?? null,
      presentAddress: body.presentAddress ?? null,
      permanentAddress: body.permanentAddress ?? null,
      employeeType: body.employeeType,
      departmentId: body.departmentId ? Number(body.departmentId) : null,
      designationId: body.designationId ? Number(body.designationId) : null,
      joiningDate: body.joiningDate ?? null,
      contractEndDate: body.contractEndDate ?? null,
      employmentStatus: body.employmentStatus,
      resignationDate: body.resignationDate ?? null,
      basicSalary: body.basicSalary != null ? Number(body.basicSalary) : undefined,
      hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : undefined,
      dailyWage: body.dailyWage != null ? Number(body.dailyWage) : undefined,
      rank: body.rank ?? null,
      wht: body.wht != null ? Number(body.wht) : undefined,
      advances: body.advances != null ? Number(body.advances) : undefined,
      bankName: body.bankName ?? null,
      bankAccount: body.bankAccount ?? null,
      biometricId: body.biometricId ?? null,
      currentProjectId: body.currentProjectId ? Number(body.currentProjectId) : null,
      allowances: body.allowances ?? null,
    });
    return ok({ employee });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiRequirePermission(PERMISSIONS.HR_DELETE);
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await deleteEmployee(Number(id), Number(user.id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
