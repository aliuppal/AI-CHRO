import { Suspense } from "react";
import type { Metadata } from "next";

import { DailyBriefing, DailyBriefingSkeleton } from "@/components/dashboard/daily-briefing";
import { AttritionSection, ChartSkeleton, DiversitySection } from "@/components/dashboard/dashboard-charts";
import { KpiRow, KpiRowSkeleton } from "@/components/dashboard/kpi";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const user = getCurrentUser();
  const org = user.organizationId;

  return (
    <>
      <PageHeader
        title="Command center"
        description="Headcount, retention, hiring speed and engagement, with a daily briefing on what needs you today."
      />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<KpiRowSkeleton />}>
          <KpiRow organizationId={org} />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Suspense fallback={<DailyBriefingSkeleton />}>
              <DailyBriefing organizationId={org} userId={user.id} />
            </Suspense>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <AttritionSection organizationId={org} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<ChartSkeleton height={300} />}>
          <DiversitySection organizationId={org} />
        </Suspense>
      </div>
    </>
  );
}
