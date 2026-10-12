import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ReviewCycle, ReviewCycleSkeleton, StartReview } from "@/components/performance/review-cycle";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Performance" };

export default function PerformancePage() {
  const { organizationId } = getCurrentUser();
  return (
    <>
      <PageHeader
        title="Performance"
        description="Review cycles drafted from your notes and peer feedback, checked for biased language."
        actions={
          <Suspense fallback={null}>
            <StartReview organizationId={organizationId} />
          </Suspense>
        }
      />
      <Suspense fallback={<ReviewCycleSkeleton />}>
        <ReviewCycle organizationId={organizationId} />
      </Suspense>
    </>
  );
}
