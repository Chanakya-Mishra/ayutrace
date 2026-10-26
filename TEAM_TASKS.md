# AyuTrace — Healthcare Engineering Team Tasks

**Product Name:** AyuTrace  
**Tagline:** Every Dose Deserves Care.  
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, SQLite, Google Gemma 4  
**Team Window:** 4-Hour Hackathon  
**Team Size:** 4 Engineers  

---

## 1. Module Ownership Matrix

| Member | Focus Area | Primary Directories / Files | Responsibilities |
|---|---|---|---|
| **Member 1** | Project Lead & System Integrator | `app/`, `components/layout/`, `prisma/`, `README.md` | Application shell, healthcare branding, shared database architecture, end-to-end integration, manual Git management |
| **Member 2** | Gemma 4 AI Vision Engineer | `lib/ai/gemma.ts`, `app/api/scan-medicine/route.ts` | Pharmaceutical packaging prompts, evidence-grounded label parsing, unreadable date fallback handling |
| **Member 3** | Healthcare Frontend / UI/UX | `components/scanner/`, `components/inventory/`, `components/facilities/`, `components/transfers/` | Pharmacist verification form, image drag-and-drop, inter-department transfer interface, accessible clinical design |
| **Member 4** | Backend & Pharmaceutical Rules | `lib/inventory/dates.ts`, `app/api/inventory/`, `app/api/transfers/`, `scripts/smoke_test.ts` | Statutory Indian month/year expiry rules, atomic transfer transactions, negative-stock prevention, test suite |

---

## 2. API & Data Contracts

All endpoints return structured JSON: `{ success: boolean, data?: any, error?: string }`:

- `POST /api/scan-medicine` — Multipart/JSON packaging photo upload -> Gemma 4 -> Structured medicine label extraction.
- `GET /api/inventory` — Query medicines and batches with search, facility filters, dosage form filters, and expiry horizons.
- `POST /api/inventory` — Register verified medicine batch with location balance and intake movement in a Prisma transaction.
- `GET /api/inventory/:id` — Query single batch with Medicine master, location balances, and movement history.
- `POST /api/inventory/:id/adjust` — Location-specific stock quantity adjustments with reason and auditor logging.
- `GET /api/facilities` & `POST /api/facilities` — Query and create healthcare facilities.
- `POST /api/facilities/:id/locations` — Create storage departments / shelves within a facility.
- `GET /api/transfers` & `POST /api/transfers` — Query and execute atomic stock transfers between two locations.
- `GET /api/stats` — Real database metrics for KPI cards, facility bars, and expiry curves.
- `GET /api/settings` & `PUT /api/settings` — Organization preferences and Gemma 4 connection status.

---

## 3. Local Verification Commands

```bash
# Run Next.js portal
npm run dev

# Run comprehensive healthcare test suite
npx tsx scripts/smoke_test.ts

# Production build
npm run build
```
