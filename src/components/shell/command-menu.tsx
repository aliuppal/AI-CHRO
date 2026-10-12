"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, ScrollText, Search, Sparkles, UserRound } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { askChroHref, mainNav, settingsNav } from "@/lib/nav";

const aiActions = [
  { title: "Draft a job description", icon: FileText, prompt: "Draft a job description for a " },
  { title: "Draft a performance review", icon: ClipboardList, prompt: "Help me draft a performance review from these notes: " },
  { title: "Generate a pulse survey", icon: Sparkles, prompt: "Create a 5-question pulse survey about " },
  { title: "Write a policy", icon: ScrollText, prompt: "Write a remote work policy for a 100-person company in " },
  { title: "Plan onboarding for a new hire", icon: UserRound, prompt: "Create a 30-60-90 day onboarding plan for a new " },
];

const noopSubscribe = () => () => {};

function useIsMac() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const isMac = useIsMac();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const question = query.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Search or ask CHRO…</span>
        <Kbd className="hidden sm:inline-flex">{isMac ? "⌘" : "Ctrl"} K</Kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a page, start an AI task, or ask a question."
      >
        <Command>
        <CommandInput
          placeholder="Search pages and actions, or type a question…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>

          {question && (
            <CommandGroup heading="Ask CHRO" forceMount>
              <CommandItem forceMount value={`ask:${question}`} onSelect={() => go(askChroHref(question, { send: true }))}>
                <Sparkles />
                <span className="truncate">Ask &ldquo;{question}&rdquo;</span>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="Go to">
            {[...mainNav, settingsNav].map((item) => (
              <CommandItem
                key={item.href}
                value={item.title}
                keywords={item.keywords}
                onSelect={() => go(item.href)}
              >
                <item.icon />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="AI actions">
            {aiActions.map((action) => (
              <CommandItem key={action.title} value={action.title} onSelect={() => go(askChroHref(action.prompt))}>
                <action.icon />
                {action.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
