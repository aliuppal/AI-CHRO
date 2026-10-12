import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { askChroHref } from "@/lib/nav";

export const metadata: Metadata = { title: "Performance" };

export default function PerformancePage() {
  return (
    <>
      <PageHeader
        title="Performance"
        description="Review cycles drafted from your notes and peer feedback, checked for biased language, plus skill-gap learning plans."
      />
      <EmptyState
        icon={TrendingUp}
        title="No review cycle running"
        description="Paste a few bullet points about someone and get a fair, specific review draft to edit."
        action={{ label: "Draft a review", href: askChroHref("Help me draft a performance review from these notes: ") }}
      />
    </>
  );
}
