import Papa from "papaparse";

import type { EmploymentType } from "@/generated/prisma/enums";

export const MAX_ROWS = 1000;
export const MAX_BYTES = 900_000;

/** Column guide shown in the import dialog. Order matches the sample file. */
export const COLUMNS: { key: string; required: boolean; help: string }[] = [
  { key: "first_name", required: true, help: "Given name" },
  { key: "last_name", required: true, help: "Family name" },
  { key: "email", required: true, help: "Work email. Used to match people who already exist." },
  { key: "job_title", required: true, help: "For example: Product Designer" },
  { key: "start_date", required: true, help: "YYYY-MM-DD, or MM/DD/YYYY" },
  { key: "department", required: false, help: "New departments are created for you" },
  { key: "manager_email", required: false, help: "Their manager's email, in this file or already in TalentMind" },
  { key: "employment_type", required: false, help: "Full-time (default), Part-time, Contractor or Intern" },
  { key: "level", required: false, help: "For example: IC3, Senior, Director" },
  { key: "country", required: false, help: "Two-letter code, defaults to US" },
  { key: "region", required: false, help: "State or province, for example CA" },
  { key: "gender_identity", required: false, help: "Self-reported: Woman, Man, Non-binary, or blank" },
];

const REQUIRED = COLUMNS.filter((c) => c.required).map((c) => c.key);

const ALIASES: Record<string, string> = {
  "first name": "first_name",
  firstname: "first_name",
  "given name": "first_name",
  "last name": "last_name",
  lastname: "last_name",
  surname: "last_name",
  "family name": "last_name",
  "email address": "email",
  "work email": "email",
  title: "job_title",
  "job title": "job_title",
  role: "job_title",
  dept: "department",
  team: "department",
  manager: "manager_email",
  "manager email": "manager_email",
  "employment type": "employment_type",
  type: "employment_type",
  "start date": "start_date",
  "hire date": "start_date",
  startdate: "start_date",
  state: "region",
  province: "region",
  gender: "gender_identity",
  "gender identity": "gender_identity",
};

function normalizeHeader(header: string) {
  const key = header
    .replace(/^﻿/, "") // Excel's byte-order mark
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
  return ALIASES[key] ?? key.replace(/ /g, "_");
}

export type EmployeeImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  startDate: Date;
  department: string | null;
  managerEmail: string | null;
  employmentType: EmploymentType;
  level: string | null;
  country: string;
  region: string | null;
  genderIdentity: string | null;
};

export type ParsedRow = {
  /** Line number in the file (the header is line 1). */
  line: number;
  name: string;
  email: string;
  data: EmployeeImportRow | null;
  errors: string[];
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDate(value: string): Date | null {
  let y: number, m: number, d: number;
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (us) [y, m, d] = [Number(us[3]), Number(us[1]), Number(us[2])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates such as 2026-02-31, which Date would roll over.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  if (y < 1950 || y > 2100) return null;
  return date;
}

function parseEmploymentType(value: string): EmploymentType | null {
  const v = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!v || v === "fulltime" || v === "ft" || v === "permanent") return "FULL_TIME";
  if (v === "parttime" || v === "pt") return "PART_TIME";
  if (v === "contractor" || v === "contract" || v === "freelance") return "CONTRACTOR";
  if (v === "intern" || v === "internship") return "INTERN";
  return null;
}

/** undefined means "not a value we understand". */
function parseGender(value: string): string | null | undefined {
  const v = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!v || v === "prefernottosay" || v === "undisclosed") return null;
  if (v === "woman" || v === "female" || v === "f") return "Woman";
  if (v === "man" || v === "male" || v === "m") return "Man";
  if (v === "nonbinary" || v === "nb") return "Non-binary";
  return undefined;
}

export type ParseResult = {
  rows: ParsedRow[];
  missingColumns: string[];
  problem: string | null;
};

/** Parse and validate a CSV. Pure: no database access. */
export function parseEmployeesCsv(text: string): ParseResult {
  if (text.length > MAX_BYTES) {
    return { rows: [], missingColumns: [], problem: "The file is too large. Split it into files under 900 KB." };
  }
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
    transform: (value) => value.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const missingColumns = REQUIRED.filter((c) => !headers.includes(c));
  if (missingColumns.length > 0) {
    return { rows: [], missingColumns, problem: "Some required columns are missing." };
  }
  if (parsed.data.length === 0) return { rows: [], missingColumns, problem: "The file has no rows under the header." };
  if (parsed.data.length > MAX_ROWS) {
    return { rows: [], missingColumns, problem: "Import up to " + MAX_ROWS + " people at a time." };
  }

  const seen = new Set<string>();
  const rows = parsed.data.map((raw, index): ParsedRow => {
    const errors: string[] = [];
    const get = (key: string) => (raw[key] ?? "").trim();

    const firstName = get("first_name");
    const lastName = get("last_name");
    const email = get("email").toLowerCase();
    const jobTitle = get("job_title");
    if (!firstName) errors.push("first_name is empty");
    if (!lastName) errors.push("last_name is empty");
    if (!jobTitle) errors.push("job_title is empty");
    if (!EMAIL.test(email)) errors.push("email is not a valid address");
    else if (seen.has(email)) errors.push("email appears more than once in this file");
    seen.add(email);
    if ([firstName, lastName, jobTitle].some((v) => v.length > 120)) errors.push("a value is longer than 120 characters");

    const startDate = parseDate(get("start_date"));
    if (!startDate) errors.push("start_date must be YYYY-MM-DD or MM/DD/YYYY");

    const employmentType = parseEmploymentType(get("employment_type"));
    if (!employmentType) errors.push("employment_type must be Full-time, Part-time, Contractor or Intern");

    const managerEmail = get("manager_email").toLowerCase() || null;
    if (managerEmail && !EMAIL.test(managerEmail)) errors.push("manager_email is not a valid address");
    if (managerEmail && managerEmail === email) errors.push("someone cannot be their own manager");

    const genderIdentity = parseGender(get("gender_identity"));
    if (genderIdentity === undefined) errors.push("gender_identity must be Woman, Man, Non-binary, or blank");

    const country = (get("country") || "US").toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) errors.push("country must be a two-letter code such as US");

    return {
      line: index + 2,
      name: [firstName, lastName].filter(Boolean).join(" ") || "(no name)",
      email,
      errors,
      data:
        errors.length === 0
          ? {
              firstName,
              lastName,
              email,
              jobTitle,
              startDate: startDate!,
              department: get("department") || null,
              managerEmail,
              employmentType: employmentType!,
              level: get("level") || null,
              country,
              region: get("region") || null,
              genderIdentity: genderIdentity ?? null,
            }
          : null,
    };
  });

  return { rows, missingColumns, problem: null };
}
