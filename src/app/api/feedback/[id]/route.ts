import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"

// PATCH /api/feedback/[id]  — body: { action: "approve"|"reject"|"feature"|"unfeature" }
// DELETE /api/feedback/[id]
export const PATCH = withErrors(async (req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const body = (await req.json()) as { action?: string }
  const action = body.action
  const valid = ["approve", "reject", "feature", "unfeature"]
  if (!action || !valid.includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 })
  }

  const existing = await db.feedback.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  switch (action) {
    case "approve":
      await db.feedback.update({ where: { id }, data: { status: "approved" } })
      break
    case "reject":
      await db.feedback.update({ where: { id }, data: { status: "rejected" } })
      break
    case "feature":
      await db.feedback.update({ where: { id }, data: { featured: true } })
      break
    case "unfeature":
      await db.feedback.update({ where: { id }, data: { featured: false } })
      break
  }

  const updated = await db.feedback.findUnique({ where: { id } })
  return Response.json(serialize(updated))
})

export const DELETE = withErrors(async (_req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })
  try {
    await db.feedback.delete({ where: { id } })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
})
