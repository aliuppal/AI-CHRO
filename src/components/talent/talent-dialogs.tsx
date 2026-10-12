"use client";

import { addCandidate, createJob } from "@/app/(app)/talent/actions";
import { FieldRow, SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";

type Option = { value: string; label: string };

export function NewJobDialog({ departments }: { departments: Option[] }) {
  return (
    <FormDialog
      triggerLabel="New role"
      triggerVariant="outline"
      title="Open a new role"
      description="Candidates you add to this role are scored against its requirements."
      submitLabel="Open role"
      action={createJob}
    >
      <TextField name="title" label="Job title" placeholder="Senior Product Designer" />
      <FieldRow>
        <SelectField name="departmentId" label="Department" optional options={departments} />
        <SelectField
          name="employmentType"
          label="Employment type"
          defaultValue="FULL_TIME"
          options={[
            { value: "FULL_TIME", label: "Full-time" },
            { value: "PART_TIME", label: "Part-time" },
            { value: "CONTRACTOR", label: "Contractor" },
            { value: "INTERN", label: "Intern" },
          ]}
        />
      </FieldRow>
      <TextField name="location" label="Location" optional placeholder="San Francisco, CA" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remote" className="size-4 accent-foreground" />
        Open to remote candidates
      </label>
      <TextareaField name="description" label="About the role" placeholder="What this person will own in their first year." />
      <TextareaField
        name="requirements"
        label="Requirements"
        optional
        hint="One per line. These drive the fit score."
        placeholder={"4+ years of product design\nDesign systems experience"}
      />
    </FormDialog>
  );
}

export function AddCandidateDialog({ jobs, defaultJobId }: { jobs: Option[]; defaultJobId?: string }) {
  return (
    <FormDialog
      triggerLabel="Add candidate"
      title="Add a candidate"
      description="They start in the Applied column for the role you choose."
      submitLabel="Add candidate"
      action={addCandidate}
    >
      <SelectField name="jobPostingId" label="Role" options={jobs} defaultValue={defaultJobId} />
      <FieldRow>
        <TextField name="firstName" label="First name" autoComplete="off" />
        <TextField name="lastName" label="Last name" autoComplete="off" />
      </FieldRow>
      <TextField name="email" label="Email" type="email" autoComplete="off" />
      <SelectField
        name="source"
        label="Source"
        optional
        options={["Referral", "LinkedIn", "Careers page", "Agency", "Other"].map((s) => ({ value: s, label: s }))}
      />
      <TextareaField
        name="resumeText"
        label="Resume"
        optional
        hint="Paste the resume text. The AI resume ranker uses it for the fit score."
        className="min-h-32"
      />
    </FormDialog>
  );
}
