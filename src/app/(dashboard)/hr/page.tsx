import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { UserSquare, CalendarClock, PlaneTakeoff, Banknote } from "lucide-react";

const cards: HubCard[] = [
  { title: "Employees", description: "Staff master records and payroll details.", href: "/hr/employees", icon: UserSquare },
  { title: "Attendance", description: "Daily check-in / check-out and status.", href: "/hr/attendance", icon: CalendarClock },
  { title: "Leave Requests", description: "Apply for leave with approval workflow.", href: "/hr/leaves", icon: PlaneTakeoff },
  { title: "Payroll Runs", description: "Generate and approve monthly payroll.", href: "/hr/payroll", icon: Banknote },
];

export default function HrPage() {
  return (
    <ModuleHub
      title="HR & Payroll"
      description="Employees, attendance, leave management and monthly payroll processing."
      cards={cards}
    />
  );
}
