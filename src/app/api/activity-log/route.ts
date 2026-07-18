import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/activity-log
// Returns the most recent N audit entries (default 50, max 200).
// Query: ?limit=50
//
// Auth: requires admin.
export async function GET(req: Request) {
  const actor = await requireAdmin(req);
  if (!actor.ok) return actor.response;

  const url = new URL(req.url);
  const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(1, limitParam), 200) : 50;

  const rows = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Join uid → TeamMember.name for display
  const uids = Array.from(new Set(rows.map((r) => r.uid)));
  const members = await db.teamMember.findMany({
    where: { uid: { in: uids } },
    select: { uid: true, name: true, email: true, role: true },
  });
  const memberMap = new Map(members.map((m) => [m.uid, m]));

  const items = rows.map((r) => {
    const m = memberMap.get(r.uid);
    return {
      id: r.id,
      uid: r.uid,
      actorName: m?.name || (r.uid === "system" ? "System" : "Unknown"),
      actorEmail: m?.email || "",
      actorRole: m?.role || null,
      action: r.action,
      target: r.target || null,
      meta: r.meta,
      createdAt: r.createdAt,
    };
  });

  return NextResponse.json(items);
}
