import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { FileText, ShoppingCart, PackageCheck } from "lucide-react";

const cards: HubCard[] = [
  { title: "Purchase Requisitions", description: "Raise and approve material/service requests.", href: "/procurement/requisitions", icon: FileText },
  { title: "Purchase Orders", description: "Convert approved requisitions into POs.", href: "/procurement/purchase-orders", icon: ShoppingCart },
  { title: "Goods Receipt Notes", description: "Receive goods against POs and post to stock.", href: "/procurement/grn", icon: PackageCheck },
];

export default function ProcurementPage() {
  return (
    <ModuleHub
      title="Procurement"
      description="End-to-end procurement workflow: Requisition → Approval → Purchase Order → Goods Receipt."
      cards={cards}
    />
  );
}
