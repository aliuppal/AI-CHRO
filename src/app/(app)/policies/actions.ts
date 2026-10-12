"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { getCurrentUser } from "@/lib/session";

const policySchema = z.object({
  title: z.string({ error: "Give the policy a title." }).max(120),
  category: z.string({ error: "Choose a category." }).max(40),
  region: z.string().max(40).optional(),
  content: z.string({ error: "Write the policy, or a first outline of it." }).min(20, { error: "Write at least a sentence or two." }).max(50000),
});

export async function createPolicy(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = getCurrentUser();
  const values = formValues(formData);
  const parsed = policySchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const data = parsed.data;

  // Keep slugs unique per organization: remote-work, remote-work-2, ...
  const base = slugify(data.title) || "policy";
  const taken = await db.policy.findMany({
    where: { organizationId: user.organizationId, slug: { startsWith: base } },
    select: { slug: true },
  });
  const slugs = new Set(taken.map((t) => t.slug));
  let slug = base;
  for (let i = 2; slugs.has(slug); i++) slug = base + "-" + i;

  const policy = await db.policy.create({
    data: {
      ...data,
      slug,
      organizationId: user.organizationId,
      authorId: user.id,
      country: "US",
      status: "DRAFT",
      aiGenerated: false,
    },
  });
  revalidatePath("/policies");
  redirect("/policies/" + policy.id);
}
