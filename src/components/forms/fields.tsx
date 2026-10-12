"use client";

import { createContext, useContext } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

export const FormStateContext = createContext<FormState>({ ok: false });

// Prefixed so field ids never collide with page ids (the layout has id="content").
const fieldId = (name: string) => "field-" + name;

function useSubmittedValue(name: string) {
  return useContext(FormStateContext).values?.[name];
}

function useFieldError(name: string) {
  return useContext(FormStateContext).errors?.[name]?.[0];
}

function FieldShell({
  name,
  label,
  hint,
  optional,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const error = useFieldError(name);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId(name)}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {hint && !error && (
        <p id={fieldId(name) + "-hint"} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldId(name) + "-error"} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(name: string, hint: string | undefined, error: string | undefined) {
  return error ? fieldId(name) + "-error" : hint ? fieldId(name) + "-hint" : undefined;
}

export function TextField({
  name,
  label,
  hint,
  optional,
  defaultValue,
  ...props
}: { name: string; label: string; hint?: string; optional?: boolean } & React.ComponentProps<"input">) {
  const error = useFieldError(name);
  const submitted = useSubmittedValue(name) ?? (defaultValue as string | undefined);
  return (
    <FieldShell name={name} label={label} hint={hint} optional={optional}>
      <Input
        id={fieldId(name)}
        name={name}
        defaultValue={submitted}
        required={!optional}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextareaField({
  name,
  label,
  hint,
  optional,
  className,
  defaultValue,
  ...props
}: { name: string; label: string; hint?: string; optional?: boolean } & React.ComponentProps<"textarea">) {
  const error = useFieldError(name);
  const submitted = useSubmittedValue(name) ?? (defaultValue as string | undefined);
  return (
    <FieldShell name={name} label={label} hint={hint} optional={optional}>
      <Textarea
        id={fieldId(name)}
        name={name}
        defaultValue={submitted}
        required={!optional}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, hint, error)}
        className={cn("min-h-24", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  options,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}) {
  const error = useFieldError(name);
  const submitted = useSubmittedValue(name);
  return (
    <FieldShell name={name} label={label} hint={hint} optional={optional}>
      <select
        // A select only reads defaultValue on mount, so remount it after a failed submit.
        key={submitted ?? "initial"}
        id={fieldId(name)}
        name={name}
        required={!optional}
        defaultValue={submitted ?? defaultValue ?? ""}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, hint, error)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
      >
        <option value="" disabled={!optional}>
          {placeholder ?? (optional ? "None" : "Choose…")}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Two fields side by side on wider screens. */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
