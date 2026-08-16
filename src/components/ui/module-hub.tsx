import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export type HubCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function ModuleHub({ title, description, cards }: { title: string; description: string; cards: HubCard[] }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
