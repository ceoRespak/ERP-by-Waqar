import {
  LayoutDashboard,
  ClipboardCheck,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  Car,
  Truck,
  Building2,
  HardHat,
  Settings,
  FolderKanban,
  ListTree,
  Activity,
  PiggyBank,
  Calculator,
  Boxes,
  FileText,
  ShieldCheck,
  Mail,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Approvals", href: "/approvals", icon: ClipboardCheck },
    ],
  },
  {
    title: "Modules",
    items: [
      { title: "Projects", href: "/projects", icon: FolderKanban, permission: "projects:read" },
      { title: "BOQ", href: "/boq", icon: ListTree, permission: "boq:read" },
      { title: "Progress", href: "/progress", icon: Activity, permission: "progress:read" },
      { title: "Budget", href: "/budget", icon: PiggyBank, permission: "budget:read" },
      { title: "Cost Control", href: "/cost", icon: Calculator, permission: "cost:read" },
      { title: "Materials", href: "/materials", icon: Boxes, permission: "materials:read" },
      { title: "Documents", href: "/documents", icon: FileText, permission: "documents:read" },
      { title: "ISO Compliance", href: "/iso", icon: ShieldCheck, permission: "iso:read" },
      { title: "Correspondence", href: "/correspondence", icon: Mail, permission: "correspondence:read" },
      { title: "Procurement", href: "/procurement", icon: ShoppingCart, permission: "procurement:read" },
      { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory:read" },
      { title: "Finance", href: "/finance", icon: Wallet, permission: "finance:read" },
      { title: "HR & Payroll", href: "/hr", icon: Users, permission: "hr:read" },
      { title: "Vehicle Tracking", href: "/vehicles", icon: Car, permission: "vehicles:read" },
      { title: "Vendors", href: "/vendors", icon: Truck, permission: "vendors:read" },
      { title: "Clients", href: "/clients", icon: Building2, permission: "clients:read" },
      { title: "Site Management", href: "/sites", icon: HardHat, permission: "sites:read" },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Users & Roles", href: "/settings", icon: Settings, permission: "settings:read" },
    ],
  },
];
