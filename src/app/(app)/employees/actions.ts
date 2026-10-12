"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { fieldError, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { getCurrentUser } from "@/lib/session";

const employeeSchema = z.object({
  firstName: z.string({ error: "Enter a first name." }).max(80),
  lastName: z.string({ error: "Enter a last name." }).max(80),
  email: z.email({ error: "Enter a valid work email." }),
  jobTitle: z.string({ error: "Enter a job title." }).max(120),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACTOR", "INTERN"]),
  startDate: z.coerce.date({ error: "Choose a start date." }),
});

export async function createEmployee(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = getCurrentUser();
  const values = formValues(formData);
  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const data = parsed.data;

  const exists = await db.employee.findFirst({
    where: { organizationId: user.organizationId, email: data.email.toLowerCase() },
    select: { id: true },
  });
  if (exists) return fieldError("email", "Someone with this email is already on the team.", values);

  await db.employee.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      organizationId: user.organizationId,
      country: "US",
    },
  });
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { ok: true, message: "Employee added." };
}
