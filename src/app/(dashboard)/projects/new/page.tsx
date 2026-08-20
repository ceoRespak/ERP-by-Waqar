import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/projects/project-form";
import { nextProjectCode } from "@/server/projects/service";

export default async function NewProjectPage() {
  await requirePermission(PERMISSIONS.PROJECTS_CREATE);
  const [clients, accounts] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const nextCode = await nextProjectCode();

  return (
    <div className="mx-auto max-w-4xl">
      <ProjectForm clients={clients} accounts={accounts} nextCode={nextCode} />
    </div>
  );
}
