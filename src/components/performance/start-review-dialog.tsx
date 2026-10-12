"use client";

import { startReview } from "@/app/(app)/performance/actions";
import { FieldRow, SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";

type Option = { value: string; label: string };

export function StartReviewDialog({
  employees,
  reviewers,
  cycleName,
}: {
  employees: Option[];
  reviewers: Option[];
  cycleName: string;
}) {
  return (
    <FormDialog
      triggerLabel="Start a review"
      title="Start a performance review"
      description="Add your notes now. The AI review drafter turns them into a fair, specific first draft."
      submitLabel="Start review"
      action={startReview}
    >
      <SelectField name="employeeId" label="Employee" options={employees} />
      <SelectField name="reviewerId" label="Reviewer" optional hint="Defaults to their manager." options={reviewers} />
      <TextField name="cycleName" label="Review cycle" defaultValue={cycleName} />
      <FieldRow>
        <TextField name="periodStart" label="Period start" type="date" defaultValue="2026-07-01" />
        <TextField name="periodEnd" label="Period end" type="date" defaultValue="2026-12-31" />
      </FieldRow>
      <TextareaField
        name="managerNotes"
        label="Your notes"
        optional
        hint="Bullet points are fine: wins, growth areas, specific examples."
        className="min-h-32"
      />
    </FormDialog>
  );
}
