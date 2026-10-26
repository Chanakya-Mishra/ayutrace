import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evaluateMedicineExpiry, parseMedicineExpiryDate } from "@/lib/inventory/dates";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await prisma.medicineBatch.findUnique({
      where: { id },
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
        movements: {
          include: {
            sourceLocation: true,
            destinationLocation: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: "Medicine batch not found" }, { status: 404 });
    }

    const totalQuantity = batch.balances.reduce((acc, b) => acc + b.quantity, 0);
    const evaluation = evaluateMedicineExpiry(
      batch.normalizedExpiryDate,
      batch.verifiedByStaff
    );

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        totalQuantity,
        evaluation,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let normalizedExpiryDate = body.normalizedExpiryDate
      ? new Date(body.normalizedExpiryDate)
      : null;
    let datePrecision = body.datePrecision || "month_year";

    if (!normalizedExpiryDate && body.expiryDateText) {
      const parsed = parseMedicineExpiryDate(body.expiryDateText);
      if (parsed.isoDate) {
        normalizedExpiryDate = new Date(parsed.isoDate);
        datePrecision = parsed.precision;
      }
    }

    const updated = await prisma.medicineBatch.update({
      where: { id },
      data: {
        batchNumber: body.batchNumber,
        manufacturingDateText: body.manufacturingDateText,
        expiryDateText: body.expiryDateText,
        normalizedExpiryDate,
        datePrecision,
        status: body.status,
        verifiedByStaff: body.verifiedByStaff ?? true,
        verifiedBy: body.verifiedBy || "Staff Pharmacist",
        notes: body.notes,
        medicine: {
          update: {
            genericName: body.genericName,
            manufacturer: body.manufacturer,
            category: body.category,
            dosageForm: body.dosageForm,
            strength: body.strength,
            storageInstructions: body.storageInstructions,
          },
        },
      },
      include: {
        medicine: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.medicineBatch.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    await prisma.medicineBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Medicine batch record archived/deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
