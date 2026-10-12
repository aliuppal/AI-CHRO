import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio) needs Neon's DIRECT (unpooled) connection:
// migrations use advisory locks that PgBouncer's transaction mode can't hold.
// The app itself connects through the pooled DATABASE_URL — see src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
