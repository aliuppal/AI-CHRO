import type { Metadata } from "next";
import { SquareKanban } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { askChroHref } from "@/lib/nav";

export const metadata: Metadata = { title: "Talent Pipeline" };

export default function TalentPage() {
  return (
    <>
      <PageHeader
        title="Talent pipeline"
        description="Open roles, every applicant scored against the job, and interview questions tailored to each resume."
      />
      <EmptyState
        icon={SquareKanban}
        title="No open roles yet"
        description="Start with a job description. Once a role is open, applicants land here ranked by fit."
        action={{ label: "Draft a job description", href: askChroHref("Draft a job description for a ") }}
      />
    </>
  );
}
