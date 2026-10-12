"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { fieldError, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { getCurrentUser } from "@/lib/session";

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED", "WITHDRAWN"] as const;

const jobSchema = z.object({
  title: z.string({ error: "Enter a job title." }).max(120),
  departmentId: z.string().optional(),
  location: z.string().max(120).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACTOR", "INTERN"]),
  description: z.string({ error: "Add a short description." }).max(5000),
  requirements: z.string().max(3000).optional(),
});

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = getCurrentUser();
  const values = formValues(formData);
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const { requirements, ...data } = parsed.data;

  const job = await db.jobPosting.create({
    data: {
      ...data,
      organizationId: user.organizationId,
      createdById: user.id,
      remote: formData.get("remote") === "on",
      requirements: (requirements ?? "")
        .split("\n")
        .map((r) => r.replace(/^[-*\s]+/, "").trim())
        .filter(Boolean),
      status: "OPEN",
      openedAt: new Date(),
    },
  });
  revalidatePath("/talent");
  return { ok: true, message: job.id };
}

const candidateSchema = z.object({
  jobPostingId: z.string({ error: "Choose a role." }),
  firstName: z.string({ error: "Enter a first name." }).max(80),
  lastName: z.string({ error: "Enter a last name." }).max(80),
  email: z.email({ error: "Enter a valid email." }),
  source: z.string().max(80).optional(),
  resumeText: z.string().max(20000).optional(),
});

export async function addCandidate(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = getCurrentUser();
  const values = formValues(formData);
  const parsed = candidateSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const { jobPostingId, ...person } = parsed.data;
  const email = person.email.toLowerCase();

  const job = await db.jobPosting.findFirst({ where: { id: jobPostingId, organizationId: user.organizationId } });
  if (!job) return fieldError("jobPostingId", "That role no longer exists.", values);

  const candidate = await db.candidate.upsert({
    where: { organizationId_email: { organizationId: user.organizationId, email } },
    create: { ...person, email, organizationId: user.organizationId, consentGivenAt: new Date() },
    update: { firstName: person.firstName, lastName: person.lastName, source: person.source, resumeText: person.resumeText },
  });

  const already = await db.application.findUnique({
    where: { candidateId_jobPostingId: { candidateId: candidate.id, jobPostingId } },
  });
  if (already) return fieldError("email", "This person has already applied for this role.", values);

  await db.application.create({
    data: { organizationId: user.organizationId, candidateId: candidate.id, jobPostingId, stage: "APPLIED" },
  });
  revalidatePath("/talent");
  return { ok: true, message: "Candidate added." };
}

export async function moveApplication(applicationId: string, stage: (typeof STAGES)[number]) {
  const user = getCurrentUser();
  if (!STAGES.includes(stage)) return;
  await db.application.updateMany({
    where: { id: applicationId, organizationId: user.organizationId },
    data: { stage, stageChangedAt: new Date() },
  });
  revalidatePath("/talent");
}
