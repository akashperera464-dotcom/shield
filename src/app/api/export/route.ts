import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";

// GET /api/export?collection=submissions|showcase|feedback|team|activity&format=json|csv
// Backs up a collection as JSON or CSV download.
//
// Auth: superadmin only.
export async function GET(req: Request) {
  const actor = await requireSuperadmin(req);
  if (!actor.ok) return actor.response;

  const url = new URL(req.url);
  const collection = url.searchParams.get("collection") || "all";
  const format = url.searchParams.get("format") || "json";

  type Row = Record<string, unknown>;
  let rows: Row[] = [];
  let filename = collection;

  const stripSensitive = (r: Row): Row => {
    // Never export password hashes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = r;
    return safe as Row;
  };

  switch (collection) {
    case "submissions":
      rows = (await db.submission.findMany({ orderBy: { createdAt: "desc" } })) as unknown as Row[];
      break;
    case "showcase":
      rows = (await db.showcase.findMany({ orderBy: { order: "asc" } })) as unknown as Row[];
      break;
    case "feedback":
      rows = (await db.feedback.findMany({ orderBy: { createdAt: "desc" } })) as unknown as Row[];
      break;
    case "team":
      rows = (await db.teamMember.findMany({ orderBy: { createdAt: "asc" } })).map(
        stripSensitive
      );
      break;
    case "activity":
      rows = (await db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 })) as unknown as Row[];
      break;
    case "all":
    default: {
      const [s, sc, f, t, a] = await Promise.all([
        db.submission.findMany({ orderBy: { createdAt: "desc" } }),
        db.showcase.findMany({ orderBy: { order: "asc" } }),
        db.feedback.findMany({ orderBy: { createdAt: "desc" } }),
        db.teamMember.findMany({ orderBy: { createdAt: "asc" } }).then((r) => r.map(stripSensitive)),
        db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
      ]);
      const bundled = {
        exportedAt: new Date().toISOString(),
        submissions: s,
        showcase: sc,
        feedback: f,
        team: t,
        activity: a,
      };
      if (format === "csv") {
        return NextResponse.json(
          { error: "CSV format only supports a single collection. Use ?collection=submissions instead of all." },
          { status: 400 }
        );
      }
      return new NextResponse(JSON.stringify(bundled, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="theshield-backup-${Date.now()}.json"`,
        },
      });
    }
  }

  await audit({
    uid: actor.info.uid,
    action: "export",
    target: collection,
    meta: { format, rowCount: rows.length },
  });

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}-${Date.now()}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(rows, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}-${Date.now()}.json"`,
    },
  });
}

// Simple CSV serializer — handles nested objects by JSON-stringifying them.
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") {
      // JSON-stringify nested objects/arrays
      const s = JSON.stringify(v);
      return `"${(s || "").replace(/"/g, '""')}"`;
    }
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = keys.join(",");
  const body = rows
    .map((r) => keys.map((k) => escape(r[k])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
