"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { fieldError, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { getCurrentUser } from "@/lib/session";

const reviewSchema = z.object({
  employeeId: z.string({ error: "Choose who is being reviewed." }),
  reviewerId: z.string().optional(),
  cycleName: z.string({ error: "Name the review cycle." }).max(60),
  periodStart: z.coerce.date({ error: "Choose a start date." }),
  periodEnd: z.coerce.date({ error: "Choose an end date." }),
  managerNotes: z.string().max(10000).optional(),
});

export async function startReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = getCurrentUser();
  const values = formValues(formData);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const data = parsed.data;
  if (data.periodEnd <= data.periodStart) {
    return fieldError("periodEnd", "The period must end after it starts.", values);
  }

  const [employee, reviewer] = await Promise.all([
    db.employee.findFirst({ where: { id: data.employeeId, organizationId: user.organizationId } }),
    data.reviewerId
      ? db.employee.findFirst({ where: { id: data.reviewerId, organizationId: user.organizationId } })
      : null,
  ]);
  if (!employee) return fieldError("employeeId", "That employee was not found.", values);

  const exists = await db.performanceReview.findUnique({
    where: { employeeId_cycleName: { employeeId: employee.id, cycleName: data.cycleName } },
  });
  if (exists) return fieldError("employeeId", "They already have a review in this cycle.", values);

  await db.performanceReview.create({
    data: {
      ...data,
      organizationId: user.organizationId,
      reviewerId: reviewer?.id ?? employee.managerId,
      status: "DRAFT",
    },
  });
  revalidatePath("/performance");
  return { ok: true, message: "Review started." };
}
