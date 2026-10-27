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
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    const isDbError =
      error?.message?.includes("database") ||
      error?.message?.includes("datasource") ||
      error?.message?.includes("protocol");

    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Database connection error. Please verify Vercel environment integration (DATABASE_URL)."
          : "Internal server error occurred during login. Please try again.",
        details: process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
