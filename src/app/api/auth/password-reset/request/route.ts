import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newSessionToken } from "@/lib/auth";
import { requireSuperadmin } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";

// POST /api/auth/password-reset/request
// Body: { email }
// Creates a single-use password reset token with 1-hour expiry.
//
// Email delivery: NOT IMPLEMENTED (no SendGrid/Resend configured). The token
// is returned in the response so the superadmin can manually share the link
// with the admin who forgot their password. The endpoint REQUIRES superadmin
// auth so it can't be used as an email-existence oracle by the public.
//
// In production with email configured, this would send an email and return
// only { ok: true } (no token in the response body).
export async function POST(req: Request) {
  const actor = await requireSuperadmin(req);
  if (!actor.ok) return actor.response;

  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  if (!body?.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();

  const member = await db.teamMember.findUnique({ where: { email } });
  if (!member) {
    return NextResponse.json(
      { error: "No admin account found with that email." },
      { status: 404 }
    );
  }

  const token = newSessionToken(); // reuse the secure RNG
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  await db.passwordReset.create({
    data: {
      id: token,
      email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  });

  await audit({
    uid: actor.info.uid,
    action: "auth.password_reset_request",
    target: member.uid,
    meta: { email },
  });

  // Without email service, return the token so superadmin can share it.
  return NextResponse.json(
    {
      ok: true,
      resetToken: token,
      message: `Reset token generated. Share this URL with ${email}: /reset?token=${token} (expires in 1 hour)`,
    },
    { status: 200 }
  );
}
