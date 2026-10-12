import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardMetrics } from "@/lib/data/dashboard";

import { AttritionChart, DiversityChart } from "./charts";

function ChartCard({
  title,
  description,
  table,
  children,
}: {
  title: string;
  description: string;
  table: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border bg-card p-6">
      <h2 className="text-heading-md font-medium">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
        <div className="mt-3 overflow-x-auto">{table}</div>
      </details>
    </section>
  );
}

const th = "px-3 py-2 text-left font-medium text-muted-foreground";
const td = "px-3 py-2 tabular-nums";

export async function AttritionSection({ organizationId }: { organizationId: string }) {
  await connection();
  const { attrition } = await getDashboardMetrics(organizationId);
  return (
    <ChartCard
      title="Attrition"
      description="Share of people who left in the 12 months to each month end."
      table={
        <table className="w-full border-collapse">
          <thead className="border-b">
            <tr>
              <th className={th}>Month</th>
              <th className={th}>Attrition</th>
              <th className={th}>Exits (12 mo)</th>
            </tr>
          </thead>
          <tbody>
            {attrition.map((row) => (
              <tr key={row.month} className="border-b last:border-0">
                <td className={td}>{row.month}</td>
                <td className={td}>{row.rate}%</td>
                <td className={td}>{row.exits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <AttritionChart data={attrition} />
    </ChartCard>
  );
}

export async function DiversitySection({ organizationId }: { organizationId: string }) {
  await connection();
  const { diversity } = await getDashboardMetrics(organizationId);
  return (
    <ChartCard
      title="Gender by department"
      description="Self-reported and optional. Shown only in aggregate."
      table={
        <table className="w-full border-collapse">
          <thead className="border-b">
            <tr>
              <th className={th}>Department</th>
              <th className={th}>Woman</th>
              <th className={th}>Man</th>
              <th className={th}>Non-binary</th>
              <th className={th}>Not disclosed</th>
              <th className={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {diversity.map((row) => (
              <tr key={row.department} className="border-b last:border-0">
                <td className="px-3 py-2">{row.department}</td>
                <td className={td}>{row.woman}</td>
                <td className={td}>{row.man}</td>
                <td className={td}>{row.nonBinary}</td>
                <td className={td}>{row.undisclosed}</td>
                <td className={td}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <DiversityChart data={diversity} />
    </ChartCard>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card p-6" aria-hidden>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mt-6 w-full" style={{ height }} />
    </div>
  );
}
