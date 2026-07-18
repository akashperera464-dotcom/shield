import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { isRateLimited, recordFailure, recordSuccess } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import type { Profile } from "@/context/AuthContext";

// Hardcoded superadmin credentials — bootstraps the system so the owner can
// always log in to manage the team even if MongoDB is unreachable.
const SUPERADMIN_EMAIL = "akashperera@shield.com";
const SUPERADMIN_PASSWORD = "akashperera123*#";
const SUPERADMIN_UID = "u_001";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null;
    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password;

    // ── Rate limit check ───────────────────────────────────────────────
    const rl = isRateLimited(req, email);
    if (rl.limited) {
      const minutes = Math.ceil(rl.retryAfterMs / 60000);
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    // ── Resolve identity ───────────────────────────────────────────────
    let uid: string;
    let name: string;
    let role: "superadmin" | "admin";

    if (email === SUPERADMIN_EMAIL) {
      // Try the hardcoded password first (bootstrap backdoor).
      if (password === SUPERADMIN_PASSWORD) {
        // Ensure a row exists in MongoDB so the user shows up in the
        // management panel + has a stored password (lazily hash + save).
        try {
          const existing = await db.teamMember.findUnique({
            where: { uid: SUPERADMIN_UID },
          });
          if (existing && !existing.passwordHash) {
            const passwordHash = await hashPassword(SUPERADMIN_PASSWORD);
            await db.teamMember.update({
              where: { uid: SUPERADMIN_UID },
              data: { passwordHash },
            });
          } else if (!existing) {
            const passwordHash = await hashPassword(SUPERADMIN_PASSWORD);
            await db.teamMember.create({
              data: {
                uid: SUPERADMIN_UID,
                name: "Akash Perera",
                email: SUPERADMIN_EMAIL,
                role: "superadmin",
                createdAt: "2026-06-01",
                jobField: "Management",
                mobile: "0741622795",
                username: "akashperera",
                passwordHash,
              },
            });
          }
        } catch (dbErr) {
          console.warn("[auth/login] superadmin DB sync failed (non-fatal):", dbErr);
        }
        uid = SUPERADMIN_UID;
        name = "Akash Perera";
        role = "superadmin";
      } else {
        // Hardcoded password didn't match — try the stored hash (owner may
        // have changed the password via User Management panel).
        try {
          const row = await db.teamMember.findUnique({
            where: { uid: SUPERADMIN_UID },
          });
          if (row && (await verifyPassword(password, row.passwordHash))) {
            uid = row.uid;
            name = row.name;
            role = "superadmin";
          } else {
            recordFailure(req, email);
            return NextResponse.json(
              { error: "Invalid email or password." },
              { status: 401 }
            );
          }
        } catch (dbErr) {
          console.warn("[auth/login] superadmin DB lookup failed:", dbErr);
          recordFailure(req, email);
          return NextResponse.json(
            { error: "Invalid email or password." },
            { status: 401 }
          );
        }
      }
    } else {
      // ── Lookup against MongoDB ───────────────────────────────────────
      let row;
      try {
        row = await db.teamMember.findUnique({ where: { email } });
      } catch (dbErr) {
        console.error("[auth/login] DB lookup failed:", dbErr);
        return NextResponse.json(
          { error: "Authentication service unavailable. Please try again." },
          { status: 503 }
        );
      }

      if (!row) {
        recordFailure(req, email);
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      const ok = await verifyPassword(password, row.passwordHash);
      if (!ok) {
        recordFailure(req, email);
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      uid = row.uid;
      name = row.name;
      role = row.role as "superadmin" | "admin";
    }

    // ── Success — create session, set cookie, audit ───────────────────
    recordSuccess(req, email);
    const { cookie } = await createSession(uid, req);
    await audit({
      uid,
      action: "auth.login",
      meta: { email },
    });

    const profile: Profile = { uid, name, email, role };
    const res = NextResponse.json(profile, { status: 200 });
    res.headers.set("set-cookie", cookie);
    return res;
  } catch (err) {
    console.error("[auth/login] unhandled error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
