import crypto from "crypto";

/**
 * Hash a plain text password using scrypt with a unique random salt.
 * Formatted as: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain text password against a stored salt:hash combination
 * using constant-time comparison to protect against timing attacks.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const parts = combinedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
