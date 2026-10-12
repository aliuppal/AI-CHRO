import type { z } from "zod";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** What the user submitted, so a failed submit can refill the form (React resets it). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };

/** Turn a failed zod parse into form state with per-field messages. */
export function fieldErrors(error: z.ZodError, values?: Record<string, string>): FormState {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (errors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Please fix the highlighted fields.", errors, values };
}

/** A single field error, keeping what the user typed. */
export function fieldError(field: string, message: string, values?: Record<string, string>): FormState {
  return { ok: false, errors: { [field]: [message] }, values };
}

/** FormData to a plain object, with empty strings treated as missing. */
export function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && value.trim() !== "") values[key] = value.trim();
  }
  return values;
}
