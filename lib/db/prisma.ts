import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Resolves the appropriate SQLite / database connection string.
 * On Vercel / serverless platforms, root filesystems are read-only (/var/task).
 * SQLite databases must be hosted in /tmp (the only writable partition in AWS Lambda).
 * This utility copies the seeded template database to /tmp/ayutrace.db on cold start.
 */
function getDatabaseUrl(): string {
  // If user configured a custom database URL (e.g. PostgreSQL, Supabase, Turso)
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // Detect serverless execution environment (Vercel, AWS Lambda)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "ayutrace.db");

    // Initialize writable database in /tmp if not already present
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.join(process.cwd(), "prisma", "template.db"),
        path.join(process.cwd(), "public", "template.db"),
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "template.db"),
        path.join(__dirname, "prisma", "template.db"),
      ];

      let copied = false;
      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            fs.chmodSync(tmpDbPath, 0o666);
            copied = true;
            break;
          } catch (err) {
            console.error(`[AyuTrace] Error copying database from ${candidate}:`, err);
          }
        }
      }

      if (!copied) {
        console.warn(
          "[AyuTrace] Template database not found. SQLite will create an empty database at /tmp/ayutrace.db."
        );
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Standard local development environment
  return envUrl || "file:./dev.db";
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
