import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { RequisitionForm } from "@/components/procurement/requisition-form";

export default async function NewRequisitionPage() {
  await requirePermission(PERMISSIONS.PROCUREMENT_CREATE);
  const [departments, projects, items] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New Purchase Requisition" description="After saving you can submit it for approval." />
      <RequisitionForm departments={departments} projects={projects} items={items} />
    </div>
  );
}
