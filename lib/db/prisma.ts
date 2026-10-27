import { PrismaClient } from "@prisma/client";

/**
 * AyuTrace Cloud PostgreSQL / Supabase Database Provider.
 * Automatically falls back to the configured Supabase transaction pooler
 * if Vercel environment variables are still being configured or synced.
 */
const SUPABASE_DEFAULT_URL =
  "postgresql://postgres.kyxalzuunmejkuljtpcl:Siddarth%40161120@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();

  // If a valid PostgreSQL/Supabase URL is provided, use it directly
  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    return envUrl;
  }

  // Fallback to primary Supabase pooler connection
  return SUPABASE_DEFAULT_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
