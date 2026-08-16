import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { BoqForm } from "@/components/boq/boq-form";

export default async function NewBoqPage() {
  await requirePermission(PERMISSIONS.BOQ_CREATE);
  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="New BOQ" description="Create a Bill of Quantities for a project." />
      <BoqForm projects={projects} />
    </div>
  );
}
