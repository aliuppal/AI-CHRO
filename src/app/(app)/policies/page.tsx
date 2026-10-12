import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { askChroHref } from "@/lib/nav";

export const metadata: Metadata = { title: "Policies" };

export default function PoliciesPage() {
  return (
    <>
      <PageHeader
        title="Policies"
        description="Handbook policies written for your size and locations, with a compliance check before anything is published."
      />
      <EmptyState
        icon={ScrollText}
        title="No policies yet"
        description="Most teams start with remote work, PTO and code of conduct."
        action={{ label: "Write a policy", href: askChroHref("Write a remote work policy for a 100-person company in ") }}
      />
    </>
  );
}
