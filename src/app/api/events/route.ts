import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/events/manifest
// Returns a "manifest" of the latest version number for each data channel.
// Clients poll this every 5s; if a version changed since their last poll,
// they re-fetch the full data for that channel via the regular GET endpoints.
//
// This is the Vercel-serverless-safe alternative to SSE: no long-lived
// connections (which Vercel kills after ~10s on hobby tier), works across
// devices (data comes from MongoDB), and is cheap (one small query per poll).
//
// Versions are derived from the most recent ActivityLog entry per channel.
// Initial state (no activity yet) returns version 0 for every channel.
export async function GET() {
  // Map each channel prefix → latest activity createdAt timestamp
  const channels = [
    "submission",
    "feedback",
    "showcase",
    "team",
    "auth",
    "config",
  ];

  const manifest: Record<string, string> = {};

  // Single query: get the latest activity log entry per action prefix
  const all = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { action: true, createdAt: true },
  });

  for (const channel of channels) {
    const latest = all.find((a) => a.action.startsWith(channel + "."));
    manifest[channel] = latest?.createdAt || "1970-01-01T00:00:00.000Z";
  }

  return NextResponse.json({
    polledAt: new Date().toISOString(),
    manifest,
  });
}
