// Server-side audit logger.
//
// Every admin mutation appends a row to ActivityLog. Read by /api/activity-log
// for the audit trail panel in SuperAdmin.
//
// Schema:
//   id        — "al_" + random
//   uid       — TeamMember.uid of actor (or "system")
//   action    — dotted string: "submission.read", "team.create", etc.
//   target    — id of the affected entity (submission id, uid, etc.)
//   meta      — optional structured payload
//   createdAt — ISO timestamp
//
// All writes are fire-and-forget (best-effort) — auditing must NEVER block
// the actual mutation. If the audit insert fails, we log to stderr and move on.

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  uid: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}

function newId(): string {
  return "al_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        id: newId(),
        uid: entry.uid || "system",
        action: entry.action,
        target: entry.target || null,
        // Cast through Prisma.InputJsonValue so the typed-client accepts
        // our Record<string, unknown>. Runtime value is plain JSON.
        meta: (entry.meta ?? null) as Prisma.InputJsonValue,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Never throw from audit — the actual mutation already succeeded.
    console.error("[audit] insert failed:", err);
  }
}
