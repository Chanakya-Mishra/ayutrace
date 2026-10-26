# AyuTrace — Vercel Deployment Guide

## 1. Zero-Config One-Click Deployment
AyuTrace is pre-configured to build and run seamlessly on **Vercel** serverless infrastructure.

### What is pre-configured:
1. **Serverless SQLite Compatibility:** On Vercel, serverless function lambdas mount `/var/task` as read-only. AyuTrace automatically copies the pre-seeded clinical database template (`prisma/template.db`) to `/tmp/ayutrace.db` (the only writable partition in AWS Lambda/Vercel) on cold start. This allows reads, writes, batch intake, stock transfers, and adjustments to function without read-only filesystem errors.
2. **Build & Prisma Generation:** `package.json` includes `"postinstall": "prisma generate"`, which ensures the Prisma client binary is compiled on Vercel build runners before `next build`.
3. **Asset & Database Tracing:** `next.config.mjs` configures `outputFileTracingIncludes` so the template database is bundled into Vercel Serverless Function packages.
4. **AI Vision Timeouts:** API scanning endpoints declare `export const maxDuration = 60;` to allow Google Gemma 4 vision models sufficient time for multimodal reasoning.

---

## 2. Deploying via Vercel Dashboard

1. **Push your code to GitHub** (as project lead).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`AyuTrace` / `Gemma4`).
4. **Build and Output Settings:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (or leave default)
   - Install Command: `npm install` (or leave default)
5. **Environment Variables:**
   Under **Environment Variables**, add the following:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key for Gemma 4 AI vision scanning |
   | `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | (Optional) The specific Gemma 4 model variant to invoke |

   *(Note: You do NOT need to set `DATABASE_URL` if using the bundled template database. The app will automatically initialize `/tmp/ayutrace.db` with sample hospitals, wards, medicines, and active batches).*

6. Click **Deploy**.

---

## 3. (Optional) Connecting a Persistent Cloud Database
If you wish to retain stock entries across serverless lambda instances long-term (instead of the ephemeral `/tmp` partition), you can point AyuTrace to a cloud database:

### Using PostgreSQL (Neon / Supabase / Vercel Postgres)
1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Add your database connection string in Vercel:
   ```text
   DATABASE_URL="postgresql://user:password@ep-host.neon.tech/ayutrace?sslmode=require"
   ```
3. Run `npx prisma db push` and `npx tsx prisma/seed.ts` to initialize your cloud database.
