// Server-only password hashing + verification utilities.
// Uses bcryptjs (pure JS — works on Vercel serverless without native build).
//
// IMPORTANT: This file must only be imported from server-side code
// (API routes, server components). Never import from client components.

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // ~50ms per hash on modern hardware — fine for admin login

/** Hash a plaintext password. Returns a 60-char bcrypt hash. */
export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext) throw new Error("Password is required.");
  if (plaintext.length < 6) throw new Error("Password must be at least 6 characters.");
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Verify a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  plaintext: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (!hash) return false; // no password set on this account yet
  if (!plaintext) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}
