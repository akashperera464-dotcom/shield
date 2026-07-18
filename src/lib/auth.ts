// Server-only auth helpers.
//
// Real session-token based auth:
//   • Server creates a Session row in MongoDB with a 32-byte random token.
//   • Token is set as an HttpOnly + Secure + SameSite=Lax cookie named
//     "theshield_session".
//   • On every request, readSessionFromCookie() looks up the Session row
//     by token, checks expiry, and returns the linked TeamMember.
//   • logout-everywhere: delete ALL Session rows for a uid.
//   • Rate limiting on login is handled by src/lib/rate-limit.ts.
//
// CRITICAL: this file must only be imported from server-side code (API
// routes, server components, middleware). It uses `crypto` and Prisma
// and would crash in the browser bundle.

import { db } from "@/lib/db";
import type { Profile } from "@/context/AuthContext";

export const SESSION_COOKIE = "theshield_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const TOKEN_BYTES = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cryptographically secure random token (32 bytes → 64-char hex). */
export function newSessionToken(): string {
  // Web Crypto API — available in Node 18+, Edge, and all evergreen browsers.
  // Using the globalThis shim so it works in both Node and Edge runtime.
  const g = globalThis as unknown as {
    crypto?: { getRandomValues: (arr: Uint8Array) => Uint8Array };
  };
  if (g.crypto?.getRandomValues) {
    return toHex(g.crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  }
  // Fallback — Node's require('crypto').randomBytes
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto") as { randomBytes: (n: number) => Buffer };
  return nodeCrypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export interface SessionInfo {
  uid: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  sessionId: string;
}

/**
 * Look up the session token from the cookie header and, if valid,
 * return the matching TeamMember as a Profile. Returns null if:
 *   - no cookie present
 *   - session not found in DB
 *   - session expired
 *   - linked TeamMember no longer exists
 */
export async function readSessionFromCookie(
  req: Request
): Promise<SessionInfo | null> {
  const cookie = req.headers.get("cookie") || "";
  const token = parseCookie(cookie, SESSION_COOKIE);
  if (!token) return null;

  let session;
  try {
    session = await db.session.findUnique({ where: { id: token } });
  } catch {
    return null;
  }
  if (!session) return null;

  // Expiry check
  const now = Date.now();
  const exp = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(exp) || exp < now) {
    // Expired — clean up to keep the collection small.
    try {
      await db.session.delete({ where: { id: token } });
    } catch {}
    return null;
  }

  let member;
  try {
    member = await db.teamMember.findUnique({ where: { uid: session.uid } });
  } catch {
    return null;
  }
  if (!member) return null;

  return {
    uid: member.uid,
    name: member.name,
    email: member.email,
    role: member.role as "superadmin" | "admin",
    sessionId: session.id,
  };
}

/**
 * Create a new session for a uid and return the Set-Cookie header value.
 * Also returns the session row's id (the token).
 */
export async function createSession(
  uid: string,
  req: Request
): Promise<{ token: string; cookie: string }> {
  const token = newSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const ua = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  try {
    await db.session.create({
      data: {
        id: token,
        uid,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        userAgent: ua.slice(0, 500),
        ip: ip.slice(0, 100),
      },
    });
  } catch (err) {
    console.error("[auth] createSession DB insert failed:", err);
    throw new Error("Failed to create session.");
  }

  return {
    token,
    cookie: buildCookie(token, expiresAt.toUTCString()),
  };
}

/** Build a Set-Cookie header for a session token. */
function buildCookie(token: string, expiresUtc: string): string {
  // HttpOnly + Secure + SameSite=Lax is the modern baseline.
  // - HttpOnly: JS can't read it → XSS can't steal it.
  // - Secure: only sent over HTTPS (Vercel is always HTTPS).
  // - SameSite=Lax: cookie is sent on top-level navigations and same-site
  //   requests, but NOT on cross-site POSTs (basic CSRF protection).
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expiresUtc}`;
}

/** Build a Set-Cookie header that clears the session cookie. */
export function clearCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/** Delete all sessions for a uid (logout-everywhere). */
export async function deleteAllSessions(uid: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { uid } });
  } catch (err) {
    console.error("[auth] deleteAllSessions failed:", err);
  }
}

/** Delete a single session by token (current-device logout). */
export async function deleteSession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { id: token } });
  } catch {
    // already gone — fine
  }
}

/** Parse a cookie header and return the value for a key, or null. */
function parseCookie(header: string, key: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === key) return v;
  }
  return null;
}

/** Convert SessionInfo to the public Profile shape used by AuthContext. */
export function sessionToProfile(s: SessionInfo): Profile {
  return {
    uid: s.uid,
    name: s.name,
    email: s.email,
    role: s.role,
  };
}
