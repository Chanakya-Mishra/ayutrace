import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { RegisterSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSession, sanitizeUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role, licenseNumber, department, facilityId } =
      result.data;

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists. Please log in instead.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        licenseNumber: licenseNumber?.trim() || null,
        department: department?.trim() || null,
        facilityId: facilityId || null,
      },
      include: {
        facility: true,
      },
    });

    // Create session and set cookie
    await createSession(user.id, true);

    return NextResponse.json(
      {
        success: true,
        message: "Healthcare account registered successfully",
        user: sanitizeUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while creating your account.",
      },
      { status: 500 }
    );
  }
}
