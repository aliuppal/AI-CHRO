import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { BoardSkeleton, PipelineBoard, TalentActions } from "@/components/talent/pipeline-board";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Talent Pipeline" };

type SearchParams = PageProps<"/talent">["searchParams"];

async function jobParam(searchParams: SearchParams) {
  const { job } = await searchParams;
  return typeof job === "string" ? job : undefined;
}

async function Actions({ organizationId, searchParams }: { organizationId: string; searchParams: SearchParams }) {
  return <TalentActions organizationId={organizationId} jobId={await jobParam(searchParams)} />;
}

async function Board({ organizationId, searchParams }: { organizationId: string; searchParams: SearchParams }) {
  return <PipelineBoard organizationId={organizationId} jobId={await jobParam(searchParams)} />;
}

export default function TalentPage({ searchParams }: PageProps<"/talent">) {
  const { organizationId } = getCurrentUser();
  return (
    <>
      <PageHeader
        title="Talent pipeline"
        description="Open roles and every applicant, ranked by fit."
        actions={
          <Suspense fallback={null}>
            <Actions organizationId={organizationId} searchParams={searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<BoardSkeleton />}>
        <Board organizationId={organizationId} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
