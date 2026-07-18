import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { audit } from "@/lib/audit";

// POST /api/auth/password-reset/confirm
// Body: { token, newPassword }
//
// Validates the token (exists, not expired, not used), then updates the
// password for the matching email and marks the token as used.
// Also invalidates ALL existing sessions for that uid (force re-login).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { token?: string; newPassword?: string }
    | null;
  if (!body?.token || !body?.newPassword) {
    return NextResponse.json(
      { error: "Token and new password are required" },
      { status: 400 }
    );
  }
  if (body.newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const reset = await db.passwordReset.findUnique({ where: { id: body.token } });
  if (!reset) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (reset.usedAt) {
    return NextResponse.json(
      { error: "This reset link has already been used." },
      { status: 400 }
    );
  }
  const now = Date.now();
  const exp = new Date(reset.expiresAt).getTime();
  if (exp < now) {
    return NextResponse.json(
      { error: "This reset link has expired." },
      { status: 400 }
    );
  }

  const member = await db.teamMember.findUnique({ where: { email: reset.email } });
  if (!member) {
    return NextResponse.json({ error: "Account no longer exists" }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.newPassword);
  await db.teamMember.update({
    where: { uid: member.uid },
    data: { passwordHash },
  });
  await db.passwordReset.update({
    where: { id: body.token },
    data: { usedAt: new Date().toISOString() },
  });

  // Invalidate ALL existing sessions for this uid — force re-login
  // everywhere after a password change.
  try {
    await db.session.deleteMany({ where: { uid: member.uid } });
  } catch (err) {
    console.error("[password-reset] session deleteMany failed:", err);
  }

  await audit({
    uid: member.uid,
    action: "auth.password_reset_confirm",
  });

  return NextResponse.json({ ok: true });
}
