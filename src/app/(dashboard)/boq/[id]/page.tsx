import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, requireProjectAccess, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { getBoqDetail } from "@/server/boq/service";
import { auth } from "@/lib/auth";
import { BoqEditor } from "@/components/boq/boq-editor";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BoqDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return notFound();

  await requirePermission(PERMISSIONS.BOQ_READ);

  const detail = await getBoqDetail(Number(id));
  if (!detail) notFound();

  // Project-scoped access to the owning project (admins bypass)
  await requireProjectAccess(user, detail.boq.projectId, "VIEWER");

  const items = detail.items.map((i) => ({
    id: i.id,
    parentId: i.parentId,
    itemCode: i.itemCode,
    description: i.description,
    category: i.category,
    unit: i.unit,
    quantity: i.quantity.toNumber(),
    rate: i.rate.toNumber(),
    amount: i.amount.toNumber(),
    rateAnalysis: i.rateAnalysis
      ? {
          materialCost: i.rateAnalysis.materialCost.toNumber(),
          laborCost: i.rateAnalysis.laborCost.toNumber(),
          equipmentCost: i.rateAnalysis.equipmentCost.toNumber(),
          overheadPct: i.rateAnalysis.overheadPct.toNumber(),
          profitPct: i.rateAnalysis.profitPct.toNumber(),
          rate: i.rateAnalysis.rate.toNumber(),
          lines: i.rateAnalysis.lines.map((l) => ({
            componentType: l.componentType,
            description: l.description,
            quantity: l.quantity.toNumber(),
            unit: l.unit,
            unitRate: l.unitRate.toNumber(),
          })),
        }
      : null,
  }));

  const { boq } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{boq.title}</h1>
            <span className="font-mono text-sm text-muted-foreground">{boq.code}</span>
            <Badge variant={statusVariant(boq.status)}>{boq.status}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <Link href={`/projects/${boq.project.id}`} className="text-primary hover:underline">
              {boq.project.code} — {boq.project.name}
            </Link>
            <span>Version {boq.version}</span>
            <span className="font-semibold text-foreground">Total: {formatMoney(boq.totalAmount)}</span>
          </p>
        </div>
        <Link href="/boq" className="text-sm text-primary hover:underline">← All BOQs</Link>
      </div>

      <BoqEditor boqId={boq.id} boqCode={boq.code} items={items} />
    </div>
  );
}
