import type { Role } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
};

/**
 * Stand-in until authentication is added. Every page reads the user through this
 * function, so swapping in Clerk / Auth.js later is a one-file change.
 * Matches the rows created by prisma/seed.ts.
 */
export function getCurrentUser(): SessionUser {
  return {
    id: "demo-user",
    name: "Demo Admin",
    email: "admin@demo.talentmind.app",
    role: "ADMIN",
    organizationId: "demo-org",
    organizationName: "Demo Company",
  };
}
