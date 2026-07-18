import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import type { Profile } from "@/context/AuthContext";

// Hardcoded superadmin credentials — bootstraps the system so the owner can
// always log in to manage the team even if MongoDB is unreachable.
// All OTHER admins (created via the User Management panel) authenticate
// against the `passwordHash` field in MongoDB.
const SUPERADMIN_EMAIL = "akashperera@shield.com";
const SUPERADMIN_PASSWORD = "akashperera123*#";
const SUPERADMIN_UID = "u_001";

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 *
 * Returns 200 with a Profile object on success, 401 on bad credentials.
 *
 * Auth logic (in order):
 *  1. If the email matches the hardcoded superadmin email:
 *     - If the password matches the hardcoded superadmin password → superadmin.
 *     - Otherwise, look up the superadmin row in MongoDB and verify against
 *       its stored passwordHash (in case the owner changed the password
 *       via the User Management panel).
 *     - If neither matches → 401.
 *  2. Otherwise, look up the email in the TeamMember collection:
 *     - If found and passwordHash verifies → admin/superadmin (per DB role).
 *     - If not found or password mismatch → 401.
 *  3. Any other input → 401 (NO MORE open demo login).
 */
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

    // ── 1. Hardcoded superadmin shortcut ────────────────────────────────
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

        const profile: Profile = {
          uid: SUPERADMIN_UID,
          name: "Akash Perera",
          email: SUPERADMIN_EMAIL,
          role: "superadmin",
        };
        return NextResponse.json(profile, { status: 200 });
      }

      // Hardcoded password didn't match — try the stored hash (owner may
      // have changed the password via User Management panel).
      try {
        const row = await db.teamMember.findUnique({
          where: { uid: SUPERADMIN_UID },
        });
        if (row && (await verifyPassword(password, row.passwordHash))) {
          const profile: Profile = {
            uid: row.uid,
            name: row.name,
            email: row.email,
            role: "superadmin", // always superadmin for this UID
          };
          return NextResponse.json(profile, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("[auth/login] superadmin DB lookup failed:", dbErr);
      }

      // Neither hardcoded nor stored password matched.
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ── 2. Lookup against MongoDB ───────────────────────────────────────
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
      // Use the same message for "no such user" and "wrong password" so
      // attackers can't enumerate accounts by email.
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const profile: Profile = {
      uid: row.uid,
      name: row.name,
      email: row.email,
      role: row.role as "superadmin" | "admin",
    };
    return NextResponse.json(profile, { status: 200 });
  } catch (err) {
    console.error("[auth/login] unhandled error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
