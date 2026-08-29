import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { Boxes, Layers, Warehouse, ArrowLeftRight } from "lucide-react";

const cards: HubCard[] = [
  { title: "Items", description: "Master list of materials with categories and units.", href: "/inventory/items", icon: Boxes, accent: "from-blue-500 to-indigo-600" },
  { title: "Stock Levels", description: "Current on-hand quantity per item & warehouse.", href: "/inventory/stock", icon: Layers, accent: "from-emerald-500 to-teal-600" },
  { title: "Warehouses", description: "Manage store locations.", href: "/inventory/warehouses", icon: Warehouse, accent: "from-amber-500 to-orange-600" },
  { title: "Transactions", description: "Receipts, issues and adjustments history.", href: "/inventory/transactions", icon: ArrowLeftRight, accent: "from-rose-500 to-pink-600" },
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
