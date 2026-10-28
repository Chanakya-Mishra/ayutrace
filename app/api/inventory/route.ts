import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { MedicineBatchEntrySchema } from "@/lib/validations/medicine";
import { parseMedicineExpiryDate, evaluateMedicineExpiry } from "@/lib/inventory/dates";
import { invalidateCache } from "@/lib/cache/api-cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const facilityId = searchParams.get("facilityId") || "all";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";
    const dosageForm = searchParams.get("dosageForm") || "all";
    const sortBy = searchParams.get("sortBy") || "normalizedExpiryDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const batches = await prisma.medicineBatch.findMany({
      where: {
        AND: [
          category !== "all" ? { medicine: { category } } : {},
          dosageForm !== "all" ? { medicine: { dosageForm } } : {},
          status !== "all" ? { status } : {},
          facilityId !== "all"
            ? {
                balances: {
                  some: {
                    location: {
                      facilityId,
                    },
                  },
                },
              }
            : {},
          search
            ? {
                OR: [
                  { medicine: { name: { contains: search } } },
                  { medicine: { genericName: { contains: search } } },
                  { medicine: { manufacturer: { contains: search } } },
                  { batchNumber: { contains: search } },
                ],
              }
            : {},
        ],
      },
      include: {
        medicine: true,
        balances: {
          include: {
            location: {
              include: {
                facility: true,
              },
            },
          },
        },
      },
      orderBy:
        sortBy === "name"
          ? { medicine: { name: sortOrder } }
          : sortBy === "normalizedExpiryDate"
          ? { normalizedExpiryDate: sortOrder }
          : { createdAt: sortOrder },
    });

    // Compute dynamic aggregate stock and expiry evaluation for each batch
    const enriched = batches.map((batch) => {
      const totalQuantity = batch.balances.reduce((acc, b) => acc + b.quantity, 0);
      const evaluation = evaluateMedicineExpiry(
        batch.normalizedExpiryDate,
        batch.verifiedByStaff
      );

      return {
        ...batch,
        totalQuantity,
        evaluation,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch medicine inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = MedicineBatchEntrySchema.parse(body);

    // Compute normalized expiry date deterministically using statutory drug rules
    let normalizedExpiryDate = validated.normalizedExpiryDate
      ? new Date(validated.normalizedExpiryDate)
      : null;
    let datePrecision: "day_month_year" | "month_year" | "unknown" = "month_year";

    if (!normalizedExpiryDate && validated.expiryDateText) {
      const parsed = parseMedicineExpiryDate(validated.expiryDateText);
      if (parsed.isoDate) {
        normalizedExpiryDate = new Date(parsed.isoDate);
        datePrecision = parsed.precision;
      }
    }

    // Determine initial batch status
    let status = "active";
    if (normalizedExpiryDate) {
      const evaluation = evaluateMedicineExpiry(normalizedExpiryDate, validated.verifiedByStaff);
      if (evaluation.status === "expired") status = "expired";
      else if (evaluation.status === "urgent") status = "critical";
      else if (evaluation.status === "critical") status = "critical";
      else if (evaluation.status === "near_expiry") status = "near_expiry";
    } else {
      status = "quarantined"; // Unverified missing dates are quarantined from dispensing
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create Medicine master record
      let medicine = await tx.medicine.findFirst({
        where: {
          name: { equals: validated.name.trim() },
          dosageForm: { equals: validated.dosageForm },
          strength: validated.strength ? { equals: validated.strength.trim() } : null,
        },
      });

      if (!medicine) {
        medicine = await tx.medicine.create({
          data: {
            name: validated.name.trim(),
            genericName: validated.genericName?.trim() || null,
            brand: validated.brand?.trim() || null,
            manufacturer: validated.manufacturer?.trim() || null,
            strength: validated.strength?.trim() || null,
            dosageForm: validated.dosageForm || "Tablet",
            category: validated.category || "General",
            packSize: validated.packSize?.trim() || null,
            storageInstructions: validated.storageInstructions?.trim() || null,
            scheduleType: validated.scheduleType || "Schedule H",
            warnings: validated.warnings?.trim() || null,
          },
        });
      }

      // Create MedicineBatch record
      const batch = await tx.medicineBatch.create({
        data: {
          medicineId: medicine.id,
          batchNumber: validated.batchNumber.trim(),
          manufacturingDateText: validated.manufacturingDateText?.trim() || null,
          expiryDateText: validated.expiryDateText?.trim() || null,
          normalizedExpiryDate,
          datePrecision,
          status,
          verifiedByStaff: validated.verifiedByStaff,
          verifiedAt: new Date(),
          verifiedBy: validated.verifiedBy || "Staff Pharmacist",
          scanConfidence: validated.scanConfidence || "manual",
          notes: validated.notes?.trim() || null,
        },
        include: {
          medicine: true,
        },
      });

      // Upsert StockBalance for this location
      await tx.stockBalance.upsert({
        where: {
          batchId_locationId: {
            batchId: batch.id,
            locationId: validated.locationId,
          },
        },
        update: {
          quantity: { increment: validated.quantity },
        },
        create: {
          batchId: batch.id,
          locationId: validated.locationId,
          quantity: validated.quantity,
        },
      });

      // Log StockMovement audit trail
      await tx.stockMovement.create({
        data: {
          batchId: batch.id,
          destinationLocationId: validated.locationId,
          quantity: validated.quantity,
          movementType: "intake",
          reason: "Initial clinical stock intake / receipt verification",
          performedBy: validated.verifiedBy || "Staff Pharmacist",
          notes: `Batch ${batch.batchNumber} logged with ${validated.quantity} units`,
        },
      });

      return batch;
    });

    invalidateCache();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to commit medicine batch" },
      { status: 400 }
    );
  }
}
