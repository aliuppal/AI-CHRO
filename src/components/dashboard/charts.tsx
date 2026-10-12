"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardMetrics, GenderKey } from "@/lib/data/dashboard";

const pct = (v: number) => v + "%";

// ── Attrition: one series, so no legend; the card title names it ──
const attritionConfig = {
  rate: { label: "Attrition (trailing 12 months)", color: "var(--ink)" },
} satisfies ChartConfig;

export function AttritionChart({ data }: { data: DashboardMetrics["attrition"] }) {
  const last = data.length - 1;
  return (
    <ChartContainer config={attritionConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ top: 16, right: 52, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--hairline-cool)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={pct} allowDecimals={false} />
        <ChartTooltip
          cursor={{ stroke: "var(--hairline-strong)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">Attrition</span>
                  <span className="font-medium tabular-nums">
                    {value}% · {(item.payload as { exits: number }).exits} exits
                  </span>
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="rate"
          type="monotone"
          stroke="var(--color-rate)"
          strokeWidth={2}
          fill="var(--color-rate)"
          fillOpacity={0.06}
          activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === last ? (
              <g key="end">
                <circle cx={props.cx} cy={props.cy} r={4} fill="var(--ink)" stroke="var(--card)" strokeWidth={2} />
                <text x={(props.cx ?? 0) + 8} y={(props.cy ?? 0) + 4} fontSize={12} fill="var(--ink)">
                  {data[last].rate}%
                </text>
              </g>
            ) : (
              <g key={props.index} />
            )
          }
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ── Diversity: 100% stacked bars. Hue order validated (CVD ΔE ≥ 11), grey = not disclosed ──
const diversityConfig = {
  woman: { label: "Woman", color: "#644fc1" },
  man: { label: "Man", color: "#3ecf8e" },
  nonBinary: { label: "Non-binary", color: "#eb6834" },
  undisclosed: { label: "Not disclosed", color: "var(--hairline-strong)" },
} satisfies ChartConfig;

const KEYS: GenderKey[] = ["woman", "man", "nonBinary", "undisclosed"];

export function DiversityChart({ data }: { data: DashboardMetrics["diversity"] }) {
  const rows = data.map((d) => ({
    department: d.department,
    total: d.total,
    ...Object.fromEntries(KEYS.map((k) => [k, Math.round((d[k] / d.total) * 1000) / 10])),
    counts: d,
  }));

  return (
    <ChartContainer config={diversityConfig} className="aspect-auto w-full" style={{ height: 64 + rows.length * 40 }}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap={12}>
        <CartesianGrid horizontal={false} stroke="var(--hairline-cool)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={pct}
          tickLine={false}
          axisLine={false}
        />
        <YAxis type="category" dataKey="department" tickLine={false} axisLine={false} width={128} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const key = name as GenderKey;
                const count = (item.payload as { counts: Record<GenderKey, number> }).counts[key];
                return (
                  <span className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-[2px]" style={{ background: diversityConfig[key].color }} />
                      {diversityConfig[key].label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {value}% · {count}
                    </span>
                  </span>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} verticalAlign="top" itemSorter={null} />
        {KEYS.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="share"
            fill={"var(--color-" + key + ")"}
            stroke="var(--card)"
            strokeWidth={2}
            barSize={20}
            radius={i === KEYS.length - 1 ? [0, 4, 4, 0] : 0}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
