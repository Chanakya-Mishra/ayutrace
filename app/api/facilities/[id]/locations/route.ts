import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StorageLocationCreateSchema } from "@/lib/validations/medicine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = StorageLocationCreateSchema.parse({
      ...body,
      facilityId: id,
    });

    const location = await prisma.storageLocation.create({
      data: {
        facilityId: id,
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
