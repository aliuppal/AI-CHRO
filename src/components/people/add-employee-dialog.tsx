"use client";

import { createEmployee } from "@/app/(app)/employees/actions";
import { FieldRow, SelectField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";

type Option = { value: string; label: string };

export function AddEmployeeDialog({ departments, managers }: { departments: Option[]; managers: Option[] }) {
  return (
    <FormDialog
      triggerLabel="Add employee"
      title="Add an employee"
      description="They join the directory and start counting toward headcount and retention signals."
      submitLabel="Add employee"
      action={createEmployee}
    >
      <FieldRow>
        <TextField name="firstName" label="First name" autoComplete="off" />
        <TextField name="lastName" label="Last name" autoComplete="off" />
      </FieldRow>
      <TextField name="email" label="Work email" type="email" autoComplete="off" />
      <TextField name="jobTitle" label="Job title" placeholder="Customer Success Manager" />
      <FieldRow>
        <SelectField name="departmentId" label="Department" optional options={departments} />
        <SelectField name="managerId" label="Manager" optional options={managers} />
      </FieldRow>
      <FieldRow>
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
        <TextField name="startDate" label="Start date" type="date" />
      </FieldRow>
    </FormDialog>
  );
}
