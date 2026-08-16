import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  await requirePermission(PERMISSIONS.PROJECTS_CREATE);
  const [clients, managers, users] = await Promise.all([
    prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New Project" description="Create a project in any category and assign its team." />
      <ProjectForm clients={clients} managers={managers} users={users} />
    </div>
  );
}
