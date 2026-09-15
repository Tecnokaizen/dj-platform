import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * DJ Studio Domain Prisma migrations (M1–M4).
 * Applied after Foundation Prisma + Supabase + Foundation seed.
 * Shares the same `_prisma_migrations` ledger; migration names must stay unique.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations-dj-studio",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
