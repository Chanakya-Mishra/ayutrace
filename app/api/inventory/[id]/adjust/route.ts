import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StockAdjustmentSchema } from "@/lib/validations/medicine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = StockAdjustmentSchema.parse({
      ...body,
      batchId: id,
    });

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.stockBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId: id,
            locationId: validated.locationId,
          },
        },
      });

      const currentQty = balance ? balance.quantity : 0;
      const newQty = currentQty + validated.quantityChange;

      if (newQty < 0) {
        throw new Error(
          `Negative stock prohibited. Location currently has ${currentQty} units; cannot deduct ${Math.abs(validated.quantityChange)} units.`
        );
      }

      const updatedBalance = await tx.stockBalance.upsert({
        where: {
          batchId_locationId: {
            batchId: id,
            locationId: validated.locationId,
          },
        },
        update: {
          quantity: newQty,
        },
        create: {
          batchId: id,
          locationId: validated.locationId,
          quantity: newQty,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          batchId: id,
          destinationLocationId: validated.quantityChange > 0 ? validated.locationId : null,
          sourceLocationId: validated.quantityChange < 0 ? validated.locationId : null,
          quantity: Math.abs(validated.quantityChange),
          movementType: validated.reason,
          reason: `Stock adjusted by ${validated.quantityChange > 0 ? "+" : ""}${validated.quantityChange} units`,
          notes: validated.notes || null,
          performedBy: validated.performedBy || "Staff Pharmacist",
        },
      });

      return { balance: updatedBalance, movement };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to adjust medicine stock" },
      { status: 400 }
    );
  }
}
