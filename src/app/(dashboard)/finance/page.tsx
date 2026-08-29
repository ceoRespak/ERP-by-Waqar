import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { BookOpen, ScrollText, Banknote, ReceiptText } from "lucide-react";

const cards: HubCard[] = [
  { title: "Chart of Accounts", description: "Manage the accounts ledger structure.", href: "/finance/accounts", icon: BookOpen, accent: "from-sky-500 to-blue-600" },
  { title: "Journal Entries", description: "Post balanced double-entry transactions.", href: "/finance/journal", icon: ScrollText, accent: "from-violet-500 to-purple-600" },
  { title: "Payments", description: "Payments in / out with approvals.", href: "/finance/payments", icon: Banknote, accent: "from-emerald-500 to-teal-600" },
  { title: "Client Invoices", description: "Bill clients for projects & services.", href: "/finance/invoices", icon: ReceiptText, accent: "from-amber-500 to-orange-600" },
];

export default function FinancePage() {
  return (
    <ModuleHub
      title="Finance"
      description="Chart of accounts, journal entries, payments and client invoicing with approval controls."
      cards={cards}
    />
  );
}
