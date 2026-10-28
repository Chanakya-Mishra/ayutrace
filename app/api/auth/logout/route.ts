import { NextResponse } from "next/server";
import { destroySession, AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();

    const response = NextResponse.json({
      success: true,
      message: "Session ended successfully",
    });

    // Explicitly overwrite and expire the session cookie in response headers
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
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
