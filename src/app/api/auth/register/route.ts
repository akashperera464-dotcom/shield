import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { readSessionFromCookie, createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { Profile } from "@/context/AuthContext";

// POST /api/auth/register
// Superadmin-only endpoint to create a new admin account.
// Body: { name, email, password, jobField?, mobile?, username? }
//
// Returns the new Profile + sets a session cookie for the new admin? NO —
// we don't auto-log in the new admin. The superadmin stays logged in.
// The new admin logs in separately with their credentials.
export async function POST(req: Request) {
  // Auth gate — only superadmin can register new admins
  const actor = await readSessionFromCookie(req);
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (actor.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only superadmin can create new admin accounts." },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
    jobField?: string;
    mobile?: string;
    username?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const jobField = (body.jobField || "").trim() || null;
  const mobile = (body.mobile || "").trim() || null;
  const username = (body.username || "").trim() || null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Unique email check
  const existing = await db.teamMember.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Another admin already uses this email." },
      { status: 409 }
    );
  }

  // Unique username check (if provided)
  if (username) {
    const clash = await db.teamMember.findFirst({ where: { username } });
    if (clash) {
      return NextResponse.json(
        { error: "Another admin already uses this username." },
        { status: 409 }
      );
    }
  }

  const passwordHash = await hashPassword(password);
  const uid = "u_" + Math.random().toString(36).slice(2, 8);
  const created = await db.teamMember.create({
    data: {
      uid,
      name,
      email,
      role: "admin", // always admin — superadmin is hardcoded to uid u_001
      createdAt: new Date().toISOString().slice(0, 10),
      jobField,
      mobile,
      username,
      passwordHash,
    },
  });

  await audit({
    uid: actor.uid,
    action: "team.create",
    target: uid,
    meta: { name, email, username, jobField },
  });

  // Strip passwordHash from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _omit, ...safe } = created;
  const profile: Profile = {
    uid: safe.uid,
    name: safe.name,
    email: safe.email,
    role: "admin",
  };
  return NextResponse.json(profile, { status: 201 });
}
