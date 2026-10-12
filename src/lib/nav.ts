import {
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Settings,
  SquareKanban,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Extra words the ⌘K search should match. */
  keywords?: string[];
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "briefing", "metrics"] },
  { title: "Talent Pipeline", href: "/talent", icon: SquareKanban, keywords: ["hiring", "candidates", "jobs", "recruiting"] },
  { title: "Employees", href: "/employees", icon: Users, keywords: ["people", "team", "onboarding", "engagement", "survey"] },
  { title: "Performance", href: "/performance", icon: TrendingUp, keywords: ["reviews", "growth", "skills", "learning"] },
  { title: "Policies", href: "/policies", icon: ScrollText, keywords: ["handbook", "compliance", "legal"] },
  { title: "Ask CHRO", href: "/chat", icon: MessageSquareText, keywords: ["ai", "chat", "assistant", "question"] },
];

export const settingsNav: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
  keywords: ["account", "organization", "workspace"],
};

/** Prefilled prompts — used by the ⌘K actions and the empty states. */
export function askChroHref(prompt: string) {
  return `/chat?q=${encodeURIComponent(prompt)}`;
}
