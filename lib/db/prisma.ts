import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();

  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    return envUrl;
  }

  throw new Error(
    "Missing or invalid DATABASE_URL environment variable. Please configure PostgreSQL/Supabase connection string."
  );
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
