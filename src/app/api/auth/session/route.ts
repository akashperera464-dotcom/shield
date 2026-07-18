import { NextResponse } from "next/server";
import { readSessionFromCookie, sessionToProfile } from "@/lib/auth";

// GET /api/auth/session
// Validates the session cookie against MongoDB. Returns the Profile or 401.
//
// AuthContext calls this on mount to restore the session (cookie-based,
// so it works across devices — login on phone = logged in on desktop too,
// as long as the cookie is set there).
export async function GET(req: Request) {
  const session = await readSessionFromCookie(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(sessionToProfile(session), { status: 200 });
}
