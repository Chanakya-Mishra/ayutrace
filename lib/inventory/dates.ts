import { differenceInCalendarDays, parseISO, isValid, format, lastDayOfMonth } from "date-fns";

export interface MedicineExpiryEvaluation {
  daysRemaining: number | null;
  status: "expired" | "urgent" | "critical" | "near_expiry" | "valid" | "unverified";
  label: string;
  badgeVariant: "destructive" | "warning" | "alert" | "success" | "neutral";
  isDispensingBlocked: boolean;
  policyNotes: string;
}

/**
 * Deterministically evaluate medicine batch expiry risk based on calendar days.
 * Under pharmaceutical safety standards and statutory labelling rules (such as Drugs & Cosmetics Rules):
 * - Expired batches (past cutoff) MUST be quarantined and blocked from dispensing.
 * - Urgent batches (≤ 7 days) require immediate return to stockroom or emergency rotation.
 * - Critical batches (≤ 30 days) are flagged for fast-tracked dispensing before expiry.
 * - Near-expiry batches (≤ 60-90 days) are highlighted in inventory audits.
 * - Batches with unverified or missing dates are blocked from active dispensing until verified.
 */
export function evaluateMedicineExpiry(
  date: Date | string | null | undefined,
  verifiedByStaff: boolean = true,
  nearDays: number = 90,
  criticalDays: number = 30,
  urgentDays: number = 7
): MedicineExpiryEvaluation {
  if (!verifiedByStaff) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Pending Verification",
      badgeVariant: "neutral",
      isDispensingBlocked: true,
      policyNotes: "Medicine batch requires staff pharmacist verification before clinical release.",
    };
  }

  if (!date) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Expiry Date Missing",
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Unrecorded expiry date. Ineligible for dispensing until verified from packaging label.",
    };
  }

  const targetDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(targetDate)) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Invalid Date Format",
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Unparseable expiry date string. Audit required.",
    };
  }

  const now = new Date();
  const daysRemaining = differenceInCalendarDays(targetDate, now);

  if (daysRemaining < 0) {
    const elapsed = Math.abs(daysRemaining);
    return {
      daysRemaining,
      status: "expired",
      label: `Expired (${elapsed}d ago)`,
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Past printed expiration cutoff. Must be quarantined for safe destruction or supplier return.",
    };
  }

  if (daysRemaining <= urgentDays) {
    return {
      daysRemaining,
      status: "urgent",
      label: daysRemaining === 0 ? "Expires Today" : `Expires in ${daysRemaining}d`,
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Within urgent cutoff (≤7 days). Do not dispense for courses exceeding remaining duration.",
    };
  }

  if (daysRemaining <= criticalDays) {
    return {
      daysRemaining,
      status: "critical",
      label: `Critical (${daysRemaining}d left)`,
      badgeVariant: "warning",
      isDispensingBlocked: false,
      policyNotes: "Priority rotation required. Issue to wards/dispensaries with immediate consumption needs.",
    };
  }

  if (daysRemaining <= nearDays) {
    return {
      daysRemaining,
      status: "near_expiry",
      label: `Near Expiry (${daysRemaining}d)`,
      badgeVariant: "alert",
      isDispensingBlocked: false,
      policyNotes: "Within active monitoring window. Front-load in FEFO dispensing schedule.",
    };
  }

  return {
    daysRemaining,
    status: "valid",
    label: `Valid (${daysRemaining}d)`,
    badgeVariant: "success",
    isDispensingBlocked: false,
    policyNotes: "Batch is in good standing with standard shelf life.",
  };
}

/**
 * Format date cleanly for medical inventory display.
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "Not Recorded";
  const targetDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(targetDate)) return "Invalid Date";
  return format(targetDate, "dd MMM yyyy");
}

/**
 * Parse pharmaceutical package date strings deterministically.
 *
 * Applicable Indian & International Drug Labelling Rule:
 * When an expiry date is stated only as Month and Year (e.g., "EXP. 08/2026", "08/26", "AUG 2026"),
 * the drug is deemed to expire on the LAST DAY of the stated month (e.g. 31 August 2026 at 23:59:59).
 *
 * Supported formats:
 * - MM/YYYY or MM-YYYY (e.g. "08/2026", "08-2026") -> Last day of month
 * - MM/YY or MM-YY (e.g. "08/26") -> Last day of month in 20YY
 * - MMM YYYY (e.g. "AUG 2026", "NOV 2025") -> Last day of month
 * - DD/MM/YYYY or DD-MM-YYYY (e.g. "15/08/2026") -> Exact day
 * - YYYY-MM-DD (ISO) -> Exact day
 */
export function parseMedicineExpiryDate(
  rawText: string | null | undefined
): { isoDate: string | null; precision: "day_month_year" | "month_year" | "unknown" } {
  if (!rawText) return { isoDate: null, precision: "unknown" };
  const cleaned = rawText.trim().toUpperCase().replace(/^(EXP|EXP\.|EXPIRY|EXPIRES|USE BEFORE|USE BY)[:\s]*/i, "");

  // 1. Exact DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    if (isValid(date)) {
      return { isoDate: date.toISOString(), precision: "day_month_year" };
    }
  }

  // 2. Exact YYYY-MM-DD (ISO)
  const iso = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    if (isValid(date)) {
      return { isoDate: date.toISOString(), precision: "day_month_year" };
    }
  }

  // 3. MM/YYYY or MM-YYYY (Standard Indian / International Drug Pack format)
  // Deemed to expire on the LAST DAY of the stated month.
  const mmyyyy = cleaned.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (mmyyyy) {
    const [, month, year] = mmyyyy;
    const monthNum = Number(month);
    const yearNum = Number(year);
    if (monthNum >= 1 && monthNum <= 12) {
      // Create first day of month, then get last day
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // 4. MM/YY or MM-YY (e.g. "08/26" for August 2026)
  const mmyy = cleaned.match(/^(\d{1,2})[-/.](\d{2})$/);
  if (mmyy) {
    const [, month, yy] = mmyy;
    const monthNum = Number(month);
    const yearNum = 2000 + Number(yy);
    if (monthNum >= 1 && monthNum <= 12) {
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // 5. MMM YYYY (e.g. "AUG 2026", "OCTOBER 2027")
  const monthNames: Record<string, number> = {
    JAN: 1, JANU: 1, JANUARY: 1,
    FEB: 2, FEBR: 2, FEBRUARY: 2,
    MAR: 3, MARC: 3, MARCH: 3,
    APR: 4, APRI: 4, APRIL: 4,
    MAY: 5,
    JUN: 6, JUNE: 6,
    JUL: 7, JULY: 7,
    AUG: 8, AUGU: 8, AUGUST: 8,
    SEP: 9, SEPT: 9, SEPTEMBER: 9,
    OCT: 10, OCTO: 10, OCTOBER: 10,
    NOV: 11, NOVE: 11, NOVEMBER: 11,
    DEC: 12, DECE: 12, DECEMBER: 12,
  };

  const mmmYyyy = cleaned.match(/^([A-Z]{3,9})[\s,/-]+(\d{2,4})$/);
  if (mmmYyyy) {
    const [, mStr, yStr] = mmmYyyy;
    const monthNum = monthNames[mStr.slice(0, 3)];
    let yearNum = Number(yStr);
    if (yearNum < 100) yearNum += 2000;
    if (monthNum && yearNum >= 2000 && yearNum <= 2100) {
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // Fallback check
  const parsed = new Date(cleaned);
  if (isValid(parsed) && !isNaN(parsed.getTime())) {
    return { isoDate: parsed.toISOString(), precision: "day_month_year" };
  }

  return { isoDate: null, precision: "unknown" };
}
