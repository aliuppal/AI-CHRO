import { connection } from "next/server";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardMetrics } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";

type Delta = { text: string; up: boolean; good: boolean };

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
const percent = (n: number) => `${Math.round(n * 100)}%`;

/** 12-point trend: muted line, current point in the accent with a surface ring. */
function Sparkline({ values }: { values: number[] }) {
  const w = 88;
  const h = 32;
  const pad = 5;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [
    pad + (i * (w - pad * 2)) / (values.length - 1),
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0 overflow-visible">
      <polyline
        points={points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--ink-mute-2)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={4} fill="var(--emerald-deep)" stroke="var(--card)" strokeWidth={2} />
    </svg>
  );
}

function StatTile({
  label,
  value,
  delta,
  caption,
  trend,
}: {
  label: string;
  value: string;
  delta?: Delta;
  caption?: string;
  trend?: number[];
}) {
  const Arrow = delta?.up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-display-md font-medium">{value}</p>
        {trend && trend.length > 1 && <Sparkline values={trend} />}
      </div>
      {delta && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Arrow className={cn("size-3.5", delta.good ? "text-primary-deep" : "text-risk-high")} aria-hidden />
          {delta.text}
        </p>
      )}
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

export async function KpiRow({ organizationId }: { organizationId: string }) {
  await connection();
  const m = await getDashboardMetrics(organizationId);

  const growth = m.headcount.current - m.headcount.yearAgo;
  const enpsChange = m.enps.score !== null && m.enps.previous !== null ? m.enps.score - m.enps.previous : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatTile
        label="Headcount"
        value={String(m.headcount.current)}
        delta={{ text: `${signed(growth)} vs a year ago`, up: growth >= 0, good: growth >= 0 }}
        trend={m.headcount.trend.map((t) => t.value)}
      />
      <StatTile
        label="High retention risk"
        value={String(m.retentionRisk.atRisk)}
        caption={`${percent(m.retentionRisk.share)} of current staff`}
      />
      <StatTile
        label="Median time to fill"
        value={m.timeToFill.medianDays === null ? "—" : `${m.timeToFill.medianDays} days`}
        caption={`${m.timeToFill.roles} roles filled this year · ${m.timeToFill.open} open`}
      />
      <StatTile
        label="Women and non-binary"
        value={m.representation.womenAndNonBinary === null ? "—" : percent(m.representation.womenAndNonBinary)}
        caption={`of people who disclosed · ${percent(m.representation.disclosed)} disclosed`}
      />
      <StatTile
        label="eNPS"
        value={m.enps.score === null ? "—" : signed(m.enps.score)}
        delta={
          enpsChange === null
            ? undefined
            : { text: `${signed(enpsChange)} vs previous survey`, up: enpsChange >= 0, good: enpsChange >= 0 }
        }
        caption={m.enps.surveyTitle ? `${m.enps.responses} responses · ${m.enps.surveyTitle}` : undefined}
      />
    </div>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
