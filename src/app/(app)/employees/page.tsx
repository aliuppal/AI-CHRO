import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { AddEmployee, DirectorySkeleton, EmployeeDirectory } from "@/components/people/employee-directory";
import { ImportEmployeesDialog } from "@/components/people/import-employees-dialog";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Employees" };

async function Directory({ organizationId, searchParams }: { organizationId: string; searchParams: PageProps<"/employees">["searchParams"] }) {
  const { dept } = await searchParams;
  return <EmployeeDirectory organizationId={organizationId} departmentId={typeof dept === "string" ? dept : undefined} />;
}

export default function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  const { organizationId } = getCurrentUser();
  return (
    <>
      <PageHeader
        title="Employees"
        description="Your team, with early warnings on burnout and attrition."
        actions={
          <>
          <ImportEmployeesDialog />
          <Suspense
            fallback={
              <Button disabled>
                <Plus />
                Add employee
              </Button>
            }
          >
            <AddEmployee organizationId={organizationId} />
          </Suspense>
          </>
        }
      />
      <Suspense fallback={<DirectorySkeleton />}>
        <Directory organizationId={organizationId} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
