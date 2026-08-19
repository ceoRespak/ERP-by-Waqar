import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import {
  UserSquare,
  CalendarClock,
  PlaneTakeoff,
  Banknote,
  Building2,
  ListChecks,
  Megaphone,
  Bell,
  Smartphone,
  ScanFace,
  Wallet,
  FileText,
} from "lucide-react";

const cards: HubCard[] = [
  { title: "Employees", description: "Full HR records, project assignment, salaries & allowances.", href: "/hr/employees", icon: UserSquare },
  { title: "Projects & Sites", description: "Attendance-enabled locations with GPS gating and shifts.", href: "/hr/projects", icon: Building2 },
  { title: "Attendance", description: "Daily check-in / check-out with PM → HR approval.", href: "/hr/attendance", icon: CalendarClock },
  { title: "Leave Requests", description: "Apply for leave with balance tracking and two-step approval.", href: "/hr/leaves", icon: PlaneTakeoff },
  { title: "Leave Types", description: "Configurable leave categories with per-employee balances.", href: "/hr/leave-types", icon: ListChecks },
  { title: "Daily Wages", description: "Daily-wage worker registry, attendance and wages.", href: "/hr/daily-wages", icon: Wallet },
  { title: "Circulars", description: "Role-targeted announcements with read tracking.", href: "/hr/circulars", icon: Megaphone },
  { title: "Notifications", description: "HR workflow notifications and alerts.", href: "/hr/notifications", icon: Bell },
  { title: "Devices", description: "Approve mobile devices for self attendance.", href: "/hr/devices", icon: Smartphone },
  { title: "Face Enrollments", description: "Review and approve face-recognition enrollments.", href: "/hr/face-enrollments", icon: ScanFace },
  { title: "Reports", description: "Attendance, leaves, wages and payroll with Excel export.", href: "/hr/reports", icon: FileText },
  { title: "Payroll Runs", description: "Generate and approve monthly payroll.", href: "/hr/payroll", icon: Banknote },
];

export default function HrPage() {
  return (
    <ModuleHub
      title="HR & Payroll"
      description="Employees, projects/sites, attendance, leaves, daily wages, circulars, devices, face enrollment and payroll."
      cards={cards}
    />
  );
}
