import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { SubmissionStatus } from "@/lib/submissions"
import type { ProjectNote } from "@/data/demo"

// Helper: validates + casts the action param.
type Action =
  | { kind: "status"; status: SubmissionStatus }
  | { kind: "read" }
  | { kind: "archive"; archived: boolean }
  | { kind: "note"; note: ProjectNote }
  | { kind: "delete" }

function parseAction(body: unknown): Action | null {
  const b = body as Record<string, unknown>
  if (b.kind === "status" && typeof b.status === "string") {
    return { kind: "status", status: b.status as SubmissionStatus }
  }
  if (b.kind === "read") return { kind: "read" }
  if (b.kind === "archive" && typeof b.archived === "boolean") {
    return { kind: "archive", archived: b.archived }
  }
  if (b.kind === "note" && b.note && typeof (b.note as ProjectNote).text === "string") {
    return { kind: "note", note: b.note as ProjectNote }
  }
  if (b.kind === "delete") return { kind: "delete" }
  return null
}

// PATCH /api/submissions/[id]  — body: { kind: "status"|"read"|"archive"|"note", ... }
// DELETE /api/submissions/[id]
export const PATCH = withErrors(async (req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const body = await req.json()
  const action = parseAction(body)
  if (!action) return Response.json({ error: "Invalid action" }, { status: 400 })

  // Verify the submission exists first
  const existing = await db.submission.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  switch (action.kind) {
    case "status":
      await db.submission.update({ where: { id }, data: { status: action.status } })
      break
    case "read":
      await db.submission.update({
        where: { id },
        data: { readAt: new Date().toISOString() },
      })
      break
    case "archive":
      await db.submission.update({ where: { id }, data: { archived: action.archived } })
      break
    case "note": {
      const notes = ((existing.notes as ProjectNote[]) || []).concat([action.note])
      await db.submission.update({ where: { id }, data: { notes } })
      break
    }
  }

  const updated = await db.submission.findUnique({ where: { id } })
  return Response.json(serialize(updated))
})

export const DELETE = withErrors(async (_req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })
  try {
    await db.submission.delete({ where: { id } })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
})
