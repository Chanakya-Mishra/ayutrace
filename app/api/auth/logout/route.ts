import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log out cleanly",
      },
      { status: 500 }
    );
  }
}
