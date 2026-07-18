import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { Submission, SubmissionAttachment, SubmissionStatus } from "@/lib/submissions"
import type { ProjectNote } from "@/data/demo"

// GET /api/submissions
// Returns all submissions, newest first.
export const GET = withErrors(async () => {
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
  return Response.json(serialize(created), { status: 201 })
})
