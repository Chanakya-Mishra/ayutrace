import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { AUTH_COOKIE_NAME } from "./constants";

export { AUTH_COOKIE_NAME };

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  licenseNumber: string | null;
  department: string | null;
  facilityId: string | null;
  facility?: {
    id: string;
    name: string;
    type: string;
    city: string | null;
  } | null;
  createdAt: Date;
}

export function sanitizeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    licenseNumber: user.licenseNumber ?? null,
    department: user.department ?? null,
    facilityId: user.facilityId ?? null,
    facility: user.facility
      ? {
          id: user.facility.id,
          name: user.facility.name,
          type: user.facility.type,
          city: user.facility.city,
        }
      : null,
    createdAt: user.createdAt,
  };
}

/**
 * Creates a new session in the database and sets the session cookie.
 */
export async function createSession(userId: string, rememberMe = true): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const durationMs = (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + durationMs);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Destroys the current user session in the DB and removes the cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete(AUTH_COOKIE_NAME);
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}

/**
 * Retrieves the currently logged in user based on the active session cookie.
 * Cleans up expired sessions automatically.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            facility: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check if session expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      cookieStore.delete(AUTH_COOKIE_NAME);
      return null;
    }

    return sanitizeUser(session.user);
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}
