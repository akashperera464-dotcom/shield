import { NextResponse } from "next/server";
import { readSessionFromCookie, deleteSession, clearCookieHeader } from "@/lib/auth";
import { audit } from "@/lib/audit";

// POST /api/auth/logout
// Clears the current session cookie + deletes the Session row from DB.
//
// Query: ?everywhere=true deletes ALL sessions for this uid (logout all devices).
export async function POST(req: Request) {
  const session = await readSessionFromCookie(req);
  if (!session) {
    // Already logged out — still clear cookie just in case.
    const res = NextResponse.json({ ok: true });
    res.headers.set("set-cookie", clearCookieHeader());
    return res;
  }

  const url = new URL(req.url);
  const everywhere = url.searchParams.get("everywhere") === "true";

  if (everywhere) {
    // Delete ALL sessions for this uid
    try {
      const { db } = await import("@/lib/db");
      await db.session.deleteMany({ where: { uid: session.uid } });
    } catch (err) {
      console.error("[auth/logout] deleteMany failed:", err);
    }
    await audit({
      uid: session.uid,
      action: "auth.logout_everywhere",
    });
  } else {
    // Just this session
    await deleteSession(session.sessionId);
    await audit({
      uid: session.uid,
      action: "auth.logout",
    });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("set-cookie", clearCookieHeader());
  return res;
}
