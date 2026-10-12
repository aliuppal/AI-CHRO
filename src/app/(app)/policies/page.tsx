import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { NewPolicyDialog } from "@/components/policies/new-policy-dialog";
import { PolicyList, PolicyListSkeleton } from "@/components/policies/policy-list";
import { CATEGORIES } from "@/lib/data/policies";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Policies" };

export default function PoliciesPage() {
  const { organizationId } = getCurrentUser();
  return (
    <>
      <PageHeader
        title="Policies"
        description="Your handbook, written for your size and locations, with a compliance check before anything is published."
        actions={<NewPolicyDialog categories={CATEGORIES} />}
      />
      <Suspense fallback={<PolicyListSkeleton />}>
        <PolicyList organizationId={organizationId} />
      </Suspense>
    </>
  );
}
