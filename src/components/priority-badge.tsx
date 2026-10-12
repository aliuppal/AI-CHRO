import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/mock/notifications";

const styles: Record<Priority, { label: string; dot: string }> = {
  high: { label: "High", dot: "bg-risk-high" },
  medium: { label: "Medium", dot: "bg-risk-medium ring-1 ring-inset ring-black/10" },
  low: { label: "Low", dot: "bg-chart-4" },
};

/** Colour is never the only signal: the label always travels with the dot. */
export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { label, dot } = styles[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  );
}
