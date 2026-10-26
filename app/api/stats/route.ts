import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evaluateMedicineExpiry } from "@/lib/inventory/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "all";

    const [medicines, batches, facilities, movements, settings] = await Promise.all([
      prisma.medicine.findMany({ select: { id: true, category: true, dosageForm: true } }),
      prisma.medicineBatch.findMany({
        where: {
          status: { notIn: ["depleted"] },
          ...(facilityId !== "all"
            ? {
                balances: {
                  some: {
                    location: { facilityId },
                  },
                },
              }
            : {}),
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
        orderBy: { normalizedExpiryDate: "asc" },
      }),
      prisma.facility.findMany({
        include: {
          locations: {
            include: {
              balances: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          batch: {
            include: { medicine: true },
          },
          sourceLocation: {
            include: { facility: true },
          },
          destinationLocation: {
            include: { facility: true },
          },
        },
      }),
      prisma.appSettings.findUnique({ where: { id: "default" } }),
    ]);

    const nearDays = settings?.nearExpiryThresholdDays ?? 90;
    const criticalDays = settings?.criticalExpiryThresholdDays ?? 30;
    const urgentDays = settings?.urgentExpiryThresholdDays ?? 7;

    let totalStockUnits = 0;
    let expiredCount = 0;
    let urgentCount = 0;
    let criticalCount = 0;
    let nearExpiryCount = 0;
    let validCount = 0;
    let unverifiedCount = 0;

    const evaluatedBatches = batches.map((batch) => {
      const batchTotalQty = batch.balances.reduce((acc, b) => acc + b.quantity, 0);
      totalStockUnits += batchTotalQty;

      const evaluation = evaluateMedicineExpiry(
        batch.normalizedExpiryDate,
        batch.verifiedByStaff,
        nearDays,
        criticalDays,
        urgentDays
      );

      if (evaluation.status === "expired") expiredCount++;
      else if (evaluation.status === "urgent") urgentCount++;
      else if (evaluation.status === "critical") criticalCount++;
      else if (evaluation.status === "near_expiry") nearExpiryCount++;
      else if (evaluation.status === "valid") validCount++;
      else unverifiedCount++;

      return {
        ...batch,
        totalQuantity: batchTotalQty,
        evaluation,
      };
    });

    // Facility breakdown
    const inventoryByFacility = facilities.map((f) => {
      let units = 0;
      for (const loc of f.locations) {
        for (const bal of loc.balances) {
          units += bal.quantity;
        }
      }
      return {
        facility: f.name,
        type: f.type,
        units,
      };
    });

    // Category distribution
    const categoryMap: Record<string, number> = {};
    const dosageMap: Record<string, number> = {};

    for (const b of evaluatedBatches) {
      const cat = b.medicine.category || "General";
      const form = b.medicine.dosageForm || "Tablet";
      categoryMap[cat] = (categoryMap[cat] || 0) + b.totalQuantity;
      dosageMap[form] = (dosageMap[form] || 0) + b.totalQuantity;
    }

    const quantityByCategory = Object.entries(categoryMap)
      .map(([category, units]) => ({ category, units }))
      .sort((a, b) => b.units - a.units);

    const quantityByDosageForm = Object.entries(dosageMap)
      .map(([form, units]) => ({ form, units }))
      .sort((a, b) => b.units - a.units);

    // Risk distribution chart data
    const riskDistribution = [
      { name: "Valid / Safe Shelf", count: validCount, color: "#0d9488" },
      { name: "Near Expiry (≤90d)", count: nearExpiryCount, color: "#f59e0b" },
      { name: "Critical (≤30d)", count: criticalCount, color: "#ea580c" },
      { name: "Urgent (≤7d)", count: urgentCount, color: "#dc2626" },
      { name: "Expired (Blocked)", count: expiredCount, color: "#991b1b" },
      { name: "Unverified / Missing", count: unverifiedCount, color: "#64748b" },
    ].filter((item) => item.count > 0 || batches.length === 0);

    // Expiry timeline (next 6-12 months)
    const timelineMap: Record<string, number> = {};
    for (const b of evaluatedBatches) {
      if (b.normalizedExpiryDate) {
        const monthYear = new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "2-digit",
        }).format(new Date(b.normalizedExpiryDate));
        timelineMap[monthYear] = (timelineMap[monthYear] || 0) + b.totalQuantity;
      }
    }
    const expiryTimeline = Object.entries(timelineMap).map(([month, units]) => ({
      month,
      units,
    }));

    // Critical attention queue (top items needing immediate clinical audit)
    const criticalAttentionList = evaluatedBatches
      .filter(
        (b) =>
          b.evaluation.status === "expired" ||
          b.evaluation.status === "urgent" ||
          b.evaluation.status === "critical" ||
          b.evaluation.status === "unverified"
      )
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        registeredMedicines: medicines.length,
        totalStockUnits,
        activeBatches: batches.length,
        expiredBatches: expiredCount,
        urgentBatches: urgentCount,
        criticalBatches: criticalCount,
        nearExpiryBatches: nearExpiryCount,
        validBatches: validCount,
        unverifiedCount,
        trackingFacilities: facilities.length,
        inventoryByFacility,
        quantityByCategory,
        quantityByDosageForm,
        riskDistribution,
        expiryTimeline,
        criticalAttentionList,
        recentStockMovements: movements,
      },
    });
  } catch (error: any) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
