"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { parseEmployeesCsv, type ParsedRow } from "@/lib/import/employees-csv";
import { getCurrentUser } from "@/lib/session";

export type RowStatus = "new" | "update" | "skip" | "error";

export type PreviewRow = {
  line: number;
  name: string;
  email: string;
  department: string | null;
  status: RowStatus;
  errors: string[];
};

export type ImportPreview = {
  problem: string | null;
  missingColumns: string[];
  rows: PreviewRow[];
  counts: Record<RowStatus, number>;
  newDepartments: string[];
};

export type ImportResult = {
  ok: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  departmentsCreated: string[];
};

/** Validate the file against the database without writing anything. */
async function analyse(csv: string, updateExisting: boolean, organizationId: string) {
  const parsed = parseEmployeesCsv(csv);
  const [existing, departments] = await Promise.all([
    db.employee.findMany({ where: { organizationId }, select: { id: true, email: true } }),
    db.department.findMany({ where: { organizationId }, select: { id: true, name: true } }),
  ]);
  const existingByEmail = new Map(existing.map((e) => [e.email.toLowerCase(), e.id]));
  const fileEmails = new Set(parsed.rows.filter((r) => r.data).map((r) => r.email));
  const deptByName = new Map(departments.map((d) => [d.name.toLowerCase(), d]));

  const analysed = parsed.rows.map((row) => {
    const errors = [...row.errors];
    const manager = row.data?.managerEmail;
    if (manager && !fileEmails.has(manager) && !existingByEmail.has(manager)) {
      errors.push("manager_email " + manager + " is not in this file or in TalentMind");
    }
    const exists = existingByEmail.has(row.email);
    const status: RowStatus = errors.length > 0 ? "error" : exists ? (updateExisting ? "update" : "skip") : "new";
    return { row, errors, status };
  });

  const newDepartments = [
    ...new Set(
      analysed
        .filter((a) => a.status === "new" || a.status === "update")
        .map((a) => a.row.data?.department)
        .filter((d): d is string => !!d && !deptByName.has(d.toLowerCase())),
    ),
  ];

  return { parsed, analysed, existingByEmail, deptByName, newDepartments };
}

function toPreviewRow(row: ParsedRow, status: RowStatus, errors: string[]): PreviewRow {
  return { line: row.line, name: row.name, email: row.email, department: row.data?.department ?? null, status, errors };
}

export async function previewEmployeeImport(csv: string, updateExisting: boolean): Promise<ImportPreview> {
  const { organizationId } = getCurrentUser();
  const { parsed, analysed, newDepartments } = await analyse(csv, updateExisting, organizationId);
  const counts: Record<RowStatus, number> = { new: 0, update: 0, skip: 0, error: 0 };
  for (const a of analysed) counts[a.status]++;
  return {
    problem: parsed.problem,
    missingColumns: parsed.missingColumns,
    rows: analysed.map((a) => toPreviewRow(a.row, a.status, a.errors)),
    counts,
    newDepartments,
  };
}

export async function runEmployeeImport(csv: string, updateExisting: boolean): Promise<ImportResult> {
  const user = getCurrentUser();
  const organizationId = user.organizationId;
  // Re-validate from scratch: never trust the earlier preview.
  const { parsed, analysed, existingByEmail, deptByName, newDepartments } = await analyse(csv, updateExisting, organizationId);
  const empty = { created: 0, updated: 0, skipped: 0, failed: 0, departmentsCreated: [] as string[] };
  if (parsed.problem) return { ok: false, message: parsed.problem, ...empty };

  const toWrite = analysed.filter((a) => a.status === "new" || a.status === "update");
  if (toWrite.length === 0) return { ok: false, message: "There are no valid rows to import.", ...empty };

  // 1. Departments that do not exist yet.
  if (newDepartments.length > 0) {
    await db.department.createMany({
      data: newDepartments.map((name) => ({ organizationId, name })),
      skipDuplicates: true,
    });
    const fresh = await db.department.findMany({ where: { organizationId, name: { in: newDepartments } } });
    for (const d of fresh) deptByName.set(d.name.toLowerCase(), d);
  }
  const deptId = (name: string | null) => (name ? deptByName.get(name.toLowerCase())?.id ?? null : null);

  // 2. People. Managers are linked afterwards, once everyone exists.
  const fields = (a: (typeof toWrite)[number]) => {
    const d = a.row.data!;
    return {
      firstName: d.firstName,
      lastName: d.lastName,
      jobTitle: d.jobTitle,
      startDate: d.startDate,
      employmentType: d.employmentType,
      level: d.level,
      country: d.country,
      region: d.region,
      genderIdentity: d.genderIdentity,
      departmentId: deptId(d.department),
    };
  };
  const creates = toWrite.filter((a) => a.status === "new");
  const updates = toWrite.filter((a) => a.status === "update");

  await db.employee.createMany({
    data: creates.map((a) => ({ ...fields(a), email: a.row.email, organizationId })),
    skipDuplicates: true,
  });

  const everyone = await db.employee.findMany({ where: { organizationId }, select: { id: true, email: true } });
  const idByEmail = new Map(everyone.map((e) => [e.email.toLowerCase(), e.id]));

  const writes = [
    ...updates.map((a) =>
      db.employee.update({ where: { id: existingByEmail.get(a.row.email)! }, data: fields(a) }),
    ),
    ...toWrite
      .filter((a) => a.row.data!.managerEmail)
      .map((a) =>
        db.employee.update({
          where: { id: idByEmail.get(a.row.email)! },
          data: { managerId: idByEmail.get(a.row.data!.managerEmail!) ?? null },
        }),
      ),
  ];
  for (let i = 0; i < writes.length; i += 100) await db.$transaction(writes.slice(i, i + 100));

  const result = {
    created: creates.length,
    updated: updates.length,
    skipped: analysed.filter((a) => a.status === "skip").length,
    failed: analysed.filter((a) => a.status === "error").length,
    departmentsCreated: newDepartments,
  };
  await db.auditLog.create({
    data: { organizationId, actorId: user.id, action: "employee.import", entity: "Employee", metadata: result },
  });

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { ok: true, message: "Import complete.", ...result };
}
