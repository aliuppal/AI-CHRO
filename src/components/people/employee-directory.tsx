import Link from "next/link";
import { connection } from "next/server";

import { StatusDot, type Tone } from "@/components/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EmploymentStatus, RiskLevel } from "@/generated/prisma/enums";
import { listDepartments, listEmployees, fullName } from "@/lib/data/people";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AddEmployeeDialog } from "./add-employee-dialog";

const riskTone: Record<RiskLevel, [Tone, string]> = {
  CRITICAL: ["negative", "Critical"],
  HIGH: ["negative", "High"],
  MEDIUM: ["warning", "Medium"],
  LOW: ["neutral", "Low"],
};

const statusTone: Record<EmploymentStatus, [Tone, string]> = {
  ACTIVE: ["positive", "Active"],
  ON_LEAVE: ["warning", "On leave"],
  NOTICE_PERIOD: ["warning", "Notice period"],
  TERMINATED: ["neutral", "Left"],
};

export async function AddEmployee({ organizationId }: { organizationId: string }) {
  await connection();
  const [departments, employees] = await Promise.all([listDepartments(organizationId), listEmployees(organizationId)]);
  const managers = employees
    .filter((e) => e.directReports.length > 0)
    .map((e) => ({ value: e.id, label: fullName(e) + " · " + e.jobTitle }));
  return (
    <AddEmployeeDialog departments={departments.map((d) => ({ value: d.id, label: d.name }))} managers={managers} />
  );
}

export async function EmployeeDirectory({
  organizationId,
  departmentId,
}: {
  organizationId: string;
  departmentId?: string;
}) {
  await connection();
  const [departments, everyone] = await Promise.all([listDepartments(organizationId), listEmployees(organizationId)]);
  const rows = departmentId ? everyone.filter((e) => e.department?.id === departmentId) : everyone;
  const count = (id: string) => everyone.filter((e) => e.department?.id === id).length;

  const filters = [
    { href: "/employees", label: "All", n: everyone.length, active: !departmentId },
    ...departments.map((d) => ({
      href: "/employees?dept=" + d.id,
      label: d.name,
      n: count(d.id),
      active: departmentId === d.id,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter by department" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            aria-current={f.active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted",
              f.active && "border-foreground bg-foreground text-background hover:bg-foreground",
            )}
          >
            {f.label} <span className={cn("text-muted-foreground", f.active && "text-background/70")}>{f.n}</span>
          </Link>
        ))}
      </nav>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead className="hidden 2xl:table-cell">Manager</TableHead>
              <TableHead className="hidden 2xl:table-cell">Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">Retention risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => {
              const [riskT, riskL] = e.riskLevel ? riskTone[e.riskLevel] : (["neutral", "Not scored"] as [Tone, string]);
              const [statusT, statusL] = statusTone[e.status];
              return (
                <TableRow key={e.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium">{fullName(e)}</div>
                    <div className="text-xs text-muted-foreground">{e.email}</div>
                  </TableCell>
                  <TableCell>
                    {e.jobTitle}
                    {e.level && <span className="text-muted-foreground"> · {e.level}</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{e.department?.name ?? "—"}</TableCell>
                  <TableCell className="hidden 2xl:table-cell">{e.manager ? fullName(e.manager) : "—"}</TableCell>
                  <TableCell className="hidden tabular-nums 2xl:table-cell">{formatDate(e.startDate)}</TableCell>
                  <TableCell>
                    <StatusDot tone={statusT} label={statusL} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <StatusDot tone={riskT} label={riskL} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Retention risk is visible to admins only and is never shown to the employee.
      </p>
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="rounded-xl border bg-card p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="my-3 h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
