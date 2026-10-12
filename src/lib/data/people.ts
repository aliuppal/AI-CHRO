import "server-only";
import { db } from "@/lib/db";

export function listDepartments(organizationId: string) {
  return db.department.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

/** Current employees, for tables and pickers. */
export function listEmployees(organizationId: string, departmentId?: string) {
  return db.employee.findMany({
    where: { organizationId, status: { not: "TERMINATED" }, ...(departmentId ? { departmentId } : {}) },
    orderBy: [{ department: { name: "asc" } }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      jobTitle: true,
      level: true,
      status: true,
      startDate: true,
      riskLevel: true,
      directReports: { select: { id: true }, take: 1 },
      department: { select: { id: true, name: true } },
      manager: { select: { firstName: true, lastName: true } },
    },
  });
}

export type EmployeeRow = Awaited<ReturnType<typeof listEmployees>>[number];

export const fullName = (p: { firstName: string; lastName: string }) => p.firstName + " " + p.lastName;
