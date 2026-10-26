import { z } from "zod";

export const DateTypeEnum = z.enum([
  "expiry_date",
  "best_before",
  "use_by",
  "manufacturing_date",
  "unknown",
]);

export const ProductEntrySchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().optional().nullable(),
  category: z.string().default("General"),
  defaultUnit: z.string().default("units"),
  storageInstructions: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),

  // Batch specific fields
  batchNumber: z.string().optional().nullable(),
  quantity: z.number().int().min(1, "Stock quantity must be at least 1"),
  unit: z.string().default("units"),
  dateType: DateTypeEnum.default("unknown"),
  rawPrintedDate: z.string().optional().nullable(),
  normalizedDate: z.string().optional().nullable(),
  location: z.string().default("Main Storage"),
  verifiedByStaff: z.boolean().default(true),
  scanConfidence: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ProductEntryInput = z.infer<typeof ProductEntrySchema>;

export const StockAdjustmentSchema = z.object({
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: "Quantity change must not be zero",
  }),
  reason: z.enum([
    "initial_scan",
    "manual_entry",
    "stock_adjustment",
    "disposal",
    "sold",
    "damage_writeoff",
  ]),
  notes: z.string().optional().nullable(),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

export const AppSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  nearExpiryThresholdDays: z.number().int().min(1).max(365),
  criticalExpiryThresholdDays: z.number().int().min(1).max(90),
  dateFormat: z.string().default("YYYY-MM-DD"),
});

export type AppSettingsInput = z.infer<typeof AppSettingsSchema>;
