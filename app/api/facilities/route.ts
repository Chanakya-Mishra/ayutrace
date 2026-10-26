import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { FacilityCreateSchema } from "@/lib/validations/medicine";

export async function GET() {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        locations: {
          include: {
            balances: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = facilities.map((f) => {
      let totalStockUnits = 0;
      for (const loc of f.locations) {
        for (const bal of loc.balances) {
          totalStockUnits += bal.quantity;
        }
      }
      return {
        ...f,
        totalStockUnits,
        locationCount: f.locations.length,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = FacilityCreateSchema.parse(body);

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "AyuTrace Health Network",
          code: "AYU-HEALTH",
        },
      });
    }

    const facility = await prisma.facility.create({
      data: {
        orgId: org.id,
        name: validated.name.trim(),
        type: validated.type,
        city: validated.city?.trim() || null,
        locations: {
          create: [
            { name: "Main Pharmacy Dispensary", description: "Central dispensing counter" },
            { name: "Storage Stockroom Shelf A", description: "Bulk replenishment storage" },
          ],
        },
      },
      include: {
        locations: true,
      },
    });

    return NextResponse.json({ success: true, data: facility }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
