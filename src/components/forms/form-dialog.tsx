"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initialFormState, type FormState } from "@/lib/forms";

import { FormStateContext } from "./fields";

/** A button that opens a form in a dialog. The dialog closes when the server action succeeds. */
export function FormDialog({
  triggerLabel,
  triggerVariant = "default",
  title,
  description,
  submitLabel,
  action,
  children,
}: {
  triggerLabel: string;
  triggerVariant?: "default" | "outline";
  title: string;
  description?: string;
  submitLabel: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) setOpen(false);
    return result;
  }, initialFormState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          <Plus />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <FormStateContext.Provider value={state}>
          <form action={formAction} className="flex flex-col gap-4" noValidate>
            {children}
            {!state.ok && state.message && (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </FormStateContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
