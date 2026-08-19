import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listEmployees } from "@/server/hr/service";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/hr/employee-form";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listEmployees>>[number];

const columns: Column<Row>[] = [
  {
    key: "empCode",
    header: "Code",
    render: (r) => (
      <Link href={`/hr/employees/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
        {r.empCode}
      </Link>
    ),
  },
  {
    key: "name",
    header: "Name",
    render: (r) => (
      <Link href={`/hr/employees/${r.id}`} className="font-medium hover:underline">
        {r.firstName} {r.lastName}
      </Link>
    ),
  },
  { key: "department", header: "Department", render: (r) => r.department?.name ?? "—" },
  { key: "designation", header: "Designation", render: (r) => r.designation?.name ?? "—" },
  { key: "employeeType", header: "Type", render: (r) => <Badge variant="secondary">{r.employeeType.replace("_", " ")}</Badge> },
  { key: "currentProject", header: "Project", render: (r) => r.currentProject?.name ?? "—" },
  { key: "basicSalary", header: "Salary", className: "text-right", render: (r) => formatMoney(r.basicSalary) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
  },
];

export default async function EmployeesPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [employees, departments, designations, projects] = await Promise.all([
    listEmployees(),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.designation.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.hrProject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Full HR records — personal info, type, project assignment, salary and allowances." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={employees as Row[]} rowKey={(r) => r.id} emptyMessage="No employees yet." />
        </div>
        <div>
          <EmployeeForm departments={departments} designations={designations} projects={projects} />
        </div>
      </div>
    </div>
  );
}
