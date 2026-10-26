import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { LoginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sanitizeUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid login credentials format",
          issues: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        facility: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        },
        { status: 401 }
      );
    }

    // Create session and set cookie
    await createSession(user.id, rememberMe);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred during login.",
      },
      { status: 500 }
    );
  }
}
