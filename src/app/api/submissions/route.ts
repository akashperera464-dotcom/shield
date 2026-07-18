import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import { readSessionFromCookie } from "@/lib/auth"
import { audit } from "@/lib/audit"
import type { Submission, SubmissionAttachment, SubmissionStatus } from "@/lib/submissions"
import type { ProjectNote } from "@/data/demo"

// GET /api/submissions
// Returns all submissions, newest first.
// Auth: requires admin (any role). Public callers get 401.
export const GET = withErrors(async (req: Request) => {
  const session = await readSessionFromCookie(req)
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }
  const rows = await db.submission.findMany({
    orderBy: { createdAt: "desc" },
  })
  const items: Submission[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company || undefined,
    service: r.service,
    timeline: r.timeline || undefined,
    brief: r.brief,
    attachments: (r.attachments as SubmissionAttachment[]) || [],
    status: r.status as SubmissionStatus,
    createdAt: r.createdAt,
    notes: (r.notes as ProjectNote[]) || undefined,
    readAt: r.readAt || undefined,
    archived: r.archived,
  }))
  return Response.json(serialize(items))
})

// POST /api/submissions
// Create a new submission. Body: Submission (without readAt/archived).
// PUBLIC endpoint — clients submit projects without logging in.
export const POST = withErrors(async (req: Request) => {
  const body = await req.json() as Partial<Submission>
  if (!body.id || !body.name || !body.email || !body.service || !body.brief) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }
  const created = await db.submission.create({
    data: {
      id: body.id,
      name: body.name,
      email: body.email,
      company: body.company || "",
      service: body.service,
      timeline: body.timeline || "",
      brief: body.brief,
      attachments: body.attachments || [],
      status: body.status || "Pending",
      createdAt: body.createdAt || new Date().toISOString(),
      notes: body.notes || [],
      readAt: body.readAt || null,
      archived: body.archived || false,
    },
  })
  // Audit as "system" since this is a public submission, not an admin action
  await audit({
    uid: "system",
    action: "submission.create",
    target: created.id,
    meta: { name: created.name, email: created.email, service: created.service },
  })
  // Also record as analytics event
  try {
    await db.analyticsEvent.create({
      data: {
        id: "ae_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        kind: "submission_create",
        path: null,
        referrer: null,
        ua: (req.headers.get("user-agent") || "").slice(0, 500),
        ip: (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "").slice(0, 100),
        createdAt: new Date().toISOString(),
      },
    })
  } catch {}
  return Response.json(serialize(created), { status: 201 })
})
