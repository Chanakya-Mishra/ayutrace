# AyuTrace — Vercel Deployment Guide

AyuTrace runs seamlessly on **Vercel** serverless infrastructure backed by **Supabase PostgreSQL**.

---

## 1. Required Vercel Environment Variables

In your [Vercel Dashboard](https://vercel.com) → Your Project → **Settings** → **Environment Variables**, configure the following variables for **Production**, **Preview**, and **Development**:

| Variable | Recommended Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.kyxalzuunmejkuljtpcl:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Transaction Pooler (Port 6543) for serverless queries |
| `DIRECT_URL` | `postgresql://postgres.kyxalzuunmejkuljtpcl:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` | Supabase Direct Session Connection (Port 5432) |
| `GEMINI_API_KEY` | `Your Google Gemini API Key` | Google Gemini API key for Gemma 4 packaging vision OCR |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | Target model variant |

> [!NOTE]
> Even if environment variables take a moment to propagate, AyuTrace includes an automatic cloud fallback in `lib/db/prisma.ts` so login and database queries will never fail with datasource format errors.

---

## 2. Seeded Accounts for Testing

Once deployed, you can sign in immediately using the pre-seeded clinical staff credentials:

- **Lead Pharmacist:** `pharmacist@ayutrace.org` / `Password123!`
- **Clinical Admin:** `ananya@ayutrace.org` / `Password123!`

---

## 3. Redeploying on Vercel
After updating the environment variables:
1. Go to your **Deployments** tab on Vercel.
2. Click the three dots `...` next to the latest deployment.
3. Select **Redeploy** (with "Use existing Build Cache" unchecked).
