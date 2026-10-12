"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";

import {
  previewEmployeeImport,
  runEmployeeImport,
  type ImportPreview,
  type ImportResult,
  type RowStatus,
} from "@/app/(app)/employees/import-actions";
import { StatusDot, type Tone } from "@/components/status-dot";
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
import { COLUMNS, MAX_BYTES, MAX_ROWS } from "@/lib/import/employees-csv";
import { cn } from "@/lib/utils";

const SAMPLE_URL = "/samples/employees-sample.csv";

const STATUS: Record<RowStatus, { tone: Tone; label: (n: number) => string }> = {
  new: { tone: "positive", label: (n) => n + " new" },
  update: { tone: "info", label: (n) => n + " to update" },
  skip: { tone: "neutral", label: (n) => n + " already exist (skipped)" },
  error: { tone: "negative", label: (n) => n + " with errors" },
};

type Step = "pick" | "preview" | "done";

export function ImportEmployeesDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [csv, setCsv] = useState("");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setStep("pick");
    setFile(null);
    setCsv("");
    setFileError(null);
    setPreview(null);
    setResult(null);
  }

  async function chooseFile(next: File | null) {
    setFileError(null);
    setFile(next);
    setCsv("");
    if (!next) return;
    if (!/\.csv$/i.test(next.name)) return setFileError("Choose a .csv file. In Excel, use File > Save As > CSV.");
    if (next.size > MAX_BYTES) return setFileError("This file is over 900 KB. Split it into smaller files.");
    setCsv(await next.text());
  }

  function runPreview() {
    startTransition(async () => {
      setPreview(await previewEmployeeImport(csv, updateExisting));
      setStep("preview");
    });
  }

  function runImport() {
    startTransition(async () => {
      setResult(await runEmployeeImport(csv, updateExisting));
      setStep("done");
    });
  }

  const importable = preview ? preview.counts.new + preview.counts.update : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import employees from a CSV</DialogTitle>
          <DialogDescription>
            Up to {MAX_ROWS} people per file. You will see a preview before anything is saved.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted px-4 py-3">
              <div className="text-sm">
                <p className="font-medium">Start from the sample file</p>
                <p className="text-muted-foreground">5 example people with every column filled in.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={SAMPLE_URL} download="talentmind-employees-sample.csv">
                  <Download />
                  Download sample CSV
                </a>
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="csv-file"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-input px-6 py-8 text-center transition-colors hover:bg-muted",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                )}
              >
                <FileSpreadsheet className="size-6" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-medium">{file ? file.name : "Choose a CSV file"}</span>
                <span className="text-xs text-muted-foreground">
                  {file ? Math.ceil(file.size / 1024) + " KB · click to choose another" : "Exported from Excel, Google Sheets or your HR system"}
                </span>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-describedby={fileError ? "csv-file-error" : undefined}
                  onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {fileError && (
                <p id="csv-file-error" role="alert" className="text-xs text-destructive">
                  {fileError}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="mt-0.5 size-4 accent-foreground"
              />
              <span>
                Update people who already exist
                <span className="block text-xs text-muted-foreground">Matched by email. Otherwise they are skipped.</span>
              </span>
            </label>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Column guide</summary>
              <table className="mt-3 w-full text-left">
                <tbody>
                  {COLUMNS.map((c) => (
                    <tr key={c.key} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 align-top font-mono text-xs">{c.key}</td>
                      <td className="py-1.5 pr-3 align-top text-xs">{c.required ? "Required" : "Optional"}</td>
                      <td className="py-1.5 align-top text-xs text-muted-foreground">{c.help}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={runPreview} disabled={!csv || pending}>
                {pending ? "Checking…" : "Preview import"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="flex flex-col gap-4">
            {preview.problem ? (
              <div role="alert" className="rounded-lg border bg-risk-high-soft px-4 py-3 text-sm">
                <p className="font-medium">{preview.problem}</p>
                {preview.missingColumns.length > 0 && (
                  <p className="mt-1">
                    Missing: <span className="font-mono">{preview.missingColumns.join(", ")}</span>. Compare your header row
                    with the sample file.
                  </p>
                )}
              </div>
            ) : (
              <>
                <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Summary">
                  {(Object.keys(STATUS) as RowStatus[])
                    .filter((s) => preview.counts[s] > 0)
                    .map((s) => (
                      <li key={s}>
                        <StatusDot tone={STATUS[s].tone} label={STATUS[s].label(preview.counts[s])} />
                      </li>
                    ))}
                </ul>
                {preview.newDepartments.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    New departments will be created: {preview.newDepartments.join(", ")}
                  </p>
                )}
                <div className="max-h-72 overflow-y-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="px-3 py-2 font-medium text-muted-foreground">Line</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground">Person</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...preview.rows]
                        .sort((a, b) => Number(b.status === "error") - Number(a.status === "error") || a.line - b.line)
                        .slice(0, 200)
                        .map((r) => (
                          <tr key={r.line} className="border-b align-top last:border-0">
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.line}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {[r.email, r.department].filter(Boolean).join(" · ")}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <StatusDot tone={STATUS[r.status].tone} label={STATUS[r.status].label(1).replace(/^1 /, "")} />
                              {r.errors.length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                                  {r.errors.map((e) => (
                                    <li key={e}>{e}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {preview.counts.error > 0 && importable > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Rows with errors will be left out. Fix them in your file and import it again; people already
                    imported are matched by email.
                  </p>
                )}
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("pick")} disabled={pending}>
                Back
              </Button>
              <Button onClick={runImport} disabled={importable === 0 || pending}>
                {pending ? "Importing…" : "Import " + importable + (importable === 1 ? " person" : " people")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && result && (
          <div className="flex flex-col gap-4">
            <div role="status" className="rounded-lg border bg-muted px-4 py-4 text-sm">
              <p className="font-medium">{result.ok ? "Import complete" : result.message}</p>
              {result.ok && (
                <ul className="mt-2 flex flex-col gap-1">
                  <li>{result.created} added</li>
                  {result.updated > 0 && <li>{result.updated} updated</li>}
                  {result.skipped > 0 && <li>{result.skipped} skipped because they already exist</li>}
                  {result.failed > 0 && <li>{result.failed} left out because of errors</li>}
                  {result.departmentsCreated.length > 0 && (
                    <li>New departments: {result.departmentsCreated.join(", ")}</li>
                  )}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Import another file
              </Button>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
