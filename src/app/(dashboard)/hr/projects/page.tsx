import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects } from "@/server/hr/projects";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ProjectForm } from "@/components/hr/project-form";
import { MapPin } from "lucide-react";

type Row = Awaited<ReturnType<typeof listProjects>>[number];

const columns: Column<Row>[] = [
  {
    key: "code",
    header: "Code",
    render: (r) => <span className="font-mono text-xs font-medium">{r.code}</span>,
  },
  {
    key: "name",
    header: "Name",
    render: (r) => <span className="font-medium">{r.name}</span>,
  },
  { key: "projectType", header: "Type", render: (r) => <Badge variant="secondary">{r.projectType.replace("_", " ")}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge> },
  { key: "manager", header: "PM", render: (r) => (r.projectManager ? `${r.projectManager.firstName} ${r.projectManager.lastName}` : "—") },
  { key: "shift", header: "Shift", render: (r) => `${r.shiftStart}–${r.shiftEnd}` },
  { key: "location", header: "Location", render: (r) => (r.locationCity ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.locationCity}</span> : "—") },
];

export default async function ProjectsPage() {
  await requirePermission(PERMISSIONS.HR_READ);
  const [projects, employees] = await Promise.all([
    listProjects(),
    prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="HR Projects & Sites" description="Attendance-enabled locations with GPS gating, shifts and supervision." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} rows={projects} rowKey={(r) => r.id} emptyMessage="No HR projects yet." />
        </div>
        <div>
          <ProjectForm employees={employees} />
        </div>
      </div>
    </div>
  );
}
