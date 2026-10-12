// Sample data for the shell. Replaced by open RiskAlert rows once data exists.
export type Priority = "high" | "medium" | "low";

export type Notification = {
  id: string;
  title: string;
  detail: string;
  priority: Priority;
  href: string;
  age: string;
};

export const sampleNotifications: Notification[] = [
  {
    id: "n1",
    title: "3 offers waiting for approval",
    detail: "Engineering · oldest sent 4 days ago",
    priority: "high",
    href: "/talent",
    age: "2h",
  },
  {
    id: "n2",
    title: "2 people flagged for burnout risk",
    detail: "Customer Success · from last week's pulse survey",
    priority: "high",
    href: "/employees",
    age: "5h",
  },
  {
    id: "n3",
    title: "H2 review cycle closes Friday",
    detail: "11 reviews are still drafts",
    priority: "medium",
    href: "/performance",
    age: "1d",
  },
  {
    id: "n4",
    title: "Remote work policy is 12 months old",
    detail: "Run a compliance check before renewing",
    priority: "low",
    href: "/policies",
    age: "3d",
  },
];
