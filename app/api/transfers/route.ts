import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StockTransferSchema } from "@/lib/validations/medicine";
import { invalidateCache } from "@/lib/cache/api-cache";

export async function GET() {
  try {
    const transfers = await prisma.stockMovement.findMany({
      where: { movementType: "transfer" },
      include: {
        batch: {
          include: {
            medicine: true,
          },
        },
        sourceLocation: {
          include: {
            facility: true,
          },
        },
        destinationLocation: {
          include: {
            facility: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: transfers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = StockTransferSchema.parse(body);

    if (validated.sourceLocationId === validated.destinationLocationId) {
      return NextResponse.json(
        { success: false, error: "Source and destination storage locations cannot be identical." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check source balance
      const sourceBalance = await tx.stockBalance.findUnique({
        where: {
          batchId_locationId: {
            batchId: validated.batchId,
            locationId: validated.sourceLocationId,
          },
        },
      });

      if (!sourceBalance || sourceBalance.quantity < validated.quantity) {
        const available = sourceBalance ? sourceBalance.quantity : 0;
        throw new Error(
          `Insufficient stock at source location. Available: ${available} units, Requested: ${validated.quantity} units.`
        );
      }

      // 2. Decrement source balance
      const newSourceQty = sourceBalance.quantity - validated.quantity;
      await tx.stockBalance.update({
        where: {
          batchId_locationId: {
            batchId: validated.batchId,
            locationId: validated.sourceLocationId,
          },
        },
        data: {
          quantity: newSourceQty,
        },
      });

      // 3. Increment destination balance
      await tx.stockBalance.upsert({
        where: {
          batchId_locationId: {
            batchId: validated.batchId,
            locationId: validated.destinationLocationId,
          },
        },
        update: {
          quantity: { increment: validated.quantity },
        },
        create: {
          batchId: validated.batchId,
          locationId: validated.destinationLocationId,
          quantity: validated.quantity,
        },
      });

      // 4. Log transfer movement audit
      const movement = await tx.stockMovement.create({
        data: {
          batchId: validated.batchId,
          sourceLocationId: validated.sourceLocationId,
          destinationLocationId: validated.destinationLocationId,
          quantity: validated.quantity,
          movementType: "transfer",
          reason: validated.reason,
          notes: validated.notes || null,
          performedBy: validated.performedBy || "Staff Pharmacist",
        },
        include: {
          batch: {
            include: { medicine: true },
          },
          sourceLocation: true,
          destinationLocation: true,
        },
      });

      return movement;
    });

    invalidateCache();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/transfers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute stock transfer" },
      { status: 400 }
    );
  }
}
