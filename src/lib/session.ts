import type { Role } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationName: string;
};

/**
 * Stand-in until authentication is added. Every page reads the user through this
 * function, so swapping in Clerk / Auth.js later is a one-file change.
 */
export function getCurrentUser(): SessionUser {
  return {
    id: "demo-user",
    name: "Demo Admin",
    email: "admin@demo.talentmind.app",
    role: "ADMIN",
    organizationName: "Demo Company",
  };
}
