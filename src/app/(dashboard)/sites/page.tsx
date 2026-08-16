import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { ClipboardList, Banknote, Send, FileUp } from "lucide-react";

const cards: HubCard[] = [
  { title: "Daily Progress Reports", description: "Record site progress, manpower and issues.", href: "/sites/dpr", icon: ClipboardList },
  { title: "Check Requests", description: "Site payment requests with multi-level approval.", href: "/sites/check-requests", icon: Banknote },
  { title: "Submittals", description: "Material, drawing and specification submittals.", href: "/sites/submittals", icon: Send },
  { title: "Transmittals", description: "Site correspondence dispatch records.", href: "/sites/transmittals", icon: FileUp },
];

export default function SitesPage() {
  return (
    <ModuleHub
      title="Site Management"
      description="Daily Progress Reports (DPR), Check Requests, Submittals and Transmittals."
      cards={cards}
    />
  );
}
