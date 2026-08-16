import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { Boxes, Layers, Warehouse, ArrowLeftRight } from "lucide-react";

const cards: HubCard[] = [
  { title: "Items", description: "Master list of materials with categories and units.", href: "/inventory/items", icon: Boxes },
  { title: "Stock Levels", description: "Current on-hand quantity per item & warehouse.", href: "/inventory/stock", icon: Layers },
  { title: "Warehouses", description: "Manage store locations.", href: "/inventory/warehouses", icon: Warehouse },
  { title: "Transactions", description: "Receipts, issues and adjustments history.", href: "/inventory/transactions", icon: ArrowLeftRight },
];

export default function InventoryPage() {
  return (
    <ModuleHub
      title="Inventory"
      description="Item master, warehouses, stock levels and movement tracking."
      cards={cards}
    />
  );
}
