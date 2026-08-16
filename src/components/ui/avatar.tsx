import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
