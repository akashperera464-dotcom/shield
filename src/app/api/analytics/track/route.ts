import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/analytics/track
// Body: { kind: "pageview" | "submission_create" | "feedback_submit" | ..., path?, referrer? }
//
// Records a server-side analytics event. Used by the homepage to track
// real page views (replaces the hardcoded "2,847 visitors" stat).
//
// CRITICAL: this endpoint is unauthenticated and callable by anyone —
// it must NOT accept free-form meta (otherwise attackers can bloat the
// collection). Only the documented fields are stored, all truncated.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { kind?: string; path?: string; referrer?: string }
    | null;
  if (!body?.kind || typeof body.kind !== "string") {
    return NextResponse.json({ error: "Missing kind" }, { status: 400 });
  }

  // Allow-list of event kinds — anything else is rejected.
  const ALLOWED = new Set([
    "pageview",
    "submission_create",
    "feedback_submit",
    "showcase_click",
    "service_view",
    "contact_click",
  ]);
  if (!ALLOWED.has(body.kind)) {
    return NextResponse.json({ error: "Unknown event kind" }, { status: 400 });
  }

  const id = "ae_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const ip =
    (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "").slice(0, 100);

  try {
    await db.analyticsEvent.create({
      data: {
        id,
        kind: body.kind,
        path: (body.path || "").slice(0, 500) || null,
        referrer: (body.referrer || "").slice(0, 500) || null,
        ua,
        ip,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[analytics/track] insert failed:", err);
    // Non-fatal — don't fail the client request.
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
