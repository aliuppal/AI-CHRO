import type { Metadata } from "next";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { askChroHref } from "@/lib/nav";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Your team, onboarding plans, pulse surveys and early warnings on burnout and attrition."
      />
      <EmptyState
        icon={Users}
        title="No employees yet"
        description="Once your team is here, pulse surveys and retention signals switch on automatically. Survey answers stay anonymous."
        action={{ label: "Plan an onboarding", href: askChroHref("Create a 30-60-90 day onboarding plan for a new ") }}
      />
    </>
  );
}
