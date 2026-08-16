import { ModuleHub, type HubCard } from "@/components/ui/module-hub";
import { BookOpen, ScrollText, Banknote, ReceiptText } from "lucide-react";

const cards: HubCard[] = [
  { title: "Chart of Accounts", description: "Manage the accounts ledger structure.", href: "/finance/accounts", icon: BookOpen },
  { title: "Journal Entries", description: "Post balanced double-entry transactions.", href: "/finance/journal", icon: ScrollText },
  { title: "Payments", description: "Payments in / out with approvals.", href: "/finance/payments", icon: Banknote },
  { title: "Client Invoices", description: "Bill clients for projects & services.", href: "/finance/invoices", icon: ReceiptText },
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
