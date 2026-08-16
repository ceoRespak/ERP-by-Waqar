import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/hr/employee-form";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type Employee = Awaited<ReturnType<typeof prisma.employee.findMany>>[number] & {
  department: { name: string } | null;
  designation: { name: string } | null;
};

const columns: Column<Employee>[] = [
  { key: "empCode", header: "Code", render: (r) => <span className="font-medium">{r.empCode}</span> },
  { key: "name", header: "Name", render: (r) => `${r.firstName} ${r.lastName}` },
  { key: "department", header: "Department", render: (r) => r.department?.name ?? "—" },
  { key: "designation", header: "Designation", render: (r) => r.designation?.name ?? "—" },
  { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
  { key: "basicSalary", header: "Salary", className: "text-right", render: (r) => formatMoney(r.basicSalary) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function EmployeesPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [employees, departments, designations] = await Promise.all([
    prisma.employee.findMany({ include: { department: true, designation: true }, orderBy: [{ firstName: "asc" }] }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.designation.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Staff master records used by attendance, leave and payroll." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={employees as Employee[]} rowKey={(r) => r.id} emptyMessage="No employees yet." />
        </div>
        <EmployeeForm departments={departments} designations={designations} />
      </div>
    </div>
  );
}
