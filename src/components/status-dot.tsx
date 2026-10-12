import { cn } from "@/lib/utils";

export type Tone = "positive" | "warning" | "negative" | "neutral" | "info";

const dot: Record<Tone, string> = {
  positive: "bg-primary-deep",
  warning: "bg-risk-medium ring-1 ring-inset ring-black/10",
  negative: "bg-risk-high",
  neutral: "bg-chart-4",
  info: "bg-foreground",
};

/** A status label. Colour is never the only signal: the text always travels with the dot. */
export function StatusDot({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm whitespace-nowrap", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot[tone])} />
      {label}
    </span>
  );
}
