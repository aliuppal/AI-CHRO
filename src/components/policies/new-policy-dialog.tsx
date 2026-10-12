"use client";

import { createPolicy } from "@/app/(app)/policies/actions";
import { FieldRow, SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";

export function NewPolicyDialog({ categories }: { categories: { value: string; label: string }[] }) {
  return (
    <FormDialog
      triggerLabel="New policy"
      title="Write a new policy"
      description="It is saved as a draft. Run a compliance check before you publish."
      submitLabel="Save draft"
      action={createPolicy}
    >
      <TextField name="title" label="Title" placeholder="Bereavement Leave Policy" />
      <FieldRow>
        <SelectField name="category" label="Category" options={categories} />
        <TextField name="region" label="State or region" optional placeholder="CA" />
      </FieldRow>
      <TextareaField
        name="content"
        label="Policy text"
        hint="Markdown works: # headings and - bullet lists."
        className="min-h-48 font-mono text-[13px]"
        placeholder={"# Bereavement Leave Policy\n\n## Purpose\n..."}
      />
    </FormDialog>
  );
}
