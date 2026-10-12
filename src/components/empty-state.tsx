import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input bg-muted px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-lg border bg-background">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="text-heading-md font-medium">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
