import { z } from "zod";

export const DosageFormEnum = z.enum([
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Ointment",
  "Drops",
  "IV Fluid",
  "Suspension",
  "Inhaler",
  "Powder",
  "General",
]);

export const FacilityTypeEnum = z.enum([
  "hospital",
  "clinic",
  "pharmacy",
  "dispensary",
  "stockroom",
]);

export const MedicineBatchEntrySchema = z.object({
  // Medicine master data
  name: z.string().min(1, "Medicine commercial name is required"),
  genericName: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  dosageForm: z.string().default("Tablet"),
  category: z.string().default("General"),
  packSize: z.string().optional().nullable(),
  storageInstructions: z.string().optional().nullable(),
  scheduleType: z.string().default("Schedule H"),
  warnings: z.string().optional().nullable(),

  // Batch specific facts
  batchNumber: z.string().min(1, "Batch / Lot number is mandatory for clinical traceability"),
  manufacturingDateText: z.string().optional().nullable(),
  expiryDateText: z.string().optional().nullable(),
  normalizedExpiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // Location & Physical stock
  facilityId: z.string().min(1, "Target facility is required"),
  locationId: z.string().min(1, "Storage department / shelf is required"),
  quantity: z.number().int().min(1, "Stock intake must be at least 1 unit"),
  verifiedByStaff: z.boolean().default(true),
  verifiedBy: z.string().default("Staff Pharmacist"),
  scanConfidence: z.string().optional().nullable(),
});

export type MedicineBatchEntryInput = z.infer<typeof MedicineBatchEntrySchema>;

export const StockTransferSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  sourceLocationId: z.string().min(1, "Source storage location is required"),
  destinationLocationId: z.string().min(1, "Destination storage location is required"),
  quantity: z.number().int().min(1, "Transfer quantity must be at least 1 unit"),
  reason: z.string().min(1, "Transfer rationale is required for clinical audit"),
  notes: z.string().optional().nullable(),
  performedBy: z.string().default("Staff Pharmacist"),
});

export type StockTransferInput = z.infer<typeof StockTransferSchema>;

export const StockAdjustmentSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  locationId: z.string().min(1, "Location ID is required"),
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: "Adjustment quantity cannot be 0",
  }),
  reason: z.enum([
    "stock_intake",
    "dispense",
    "audit_correction",
    "quarantine",
    "disposal_expired",
    "damaged_in_transit",
  ]),
  notes: z.string().optional().nullable(),
  performedBy: z.string().default("Staff Pharmacist"),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

export const FacilityCreateSchema = z.object({
  name: z.string().min(1, "Facility name is required"),
  type: FacilityTypeEnum.default("hospital"),
  city: z.string().optional().nullable(),
});

export const StorageLocationCreateSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  name: z.string().min(1, "Storage location name is required"),
  description: z.string().optional().nullable(),
});

export const AppSettingsSchema = z.object({
  orgName: z.string().min(1, "Organization name is required"),
  defaultFacilityId: z.string().optional().nullable(),
  geminiApiKey: z.string().optional().nullable(),
  nearExpiryThresholdDays: z.number().int().min(1).max(365),
  criticalExpiryThresholdDays: z.number().int().min(1).max(180),
  urgentExpiryThresholdDays: z.number().int().min(1).max(90),
  dateFormat: z.string().default("DD/MM/YYYY"),
});

export type AppSettingsInput = z.infer<typeof AppSettingsSchema>;
