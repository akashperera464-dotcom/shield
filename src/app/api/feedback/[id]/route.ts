import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import { readSessionFromCookie } from "@/lib/auth"
import { audit } from "@/lib/audit"

// PATCH /api/feedback/[id]  — body: { action: "approve"|"reject"|"feature"|"unfeature" }
// DELETE /api/feedback/[id]
// Auth: requires admin.
export const PATCH = withErrors(async (req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const session = await readSessionFromCookie(req)
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }

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
      await audit({ uid: session.uid, action: "feedback.approve", target: id })
      break
    case "reject":
      await db.feedback.update({ where: { id }, data: { status: "rejected" } })
      await audit({ uid: session.uid, action: "feedback.reject", target: id })
      break
    case "feature":
      await db.feedback.update({ where: { id }, data: { featured: true } })
      await audit({ uid: session.uid, action: "feedback.feature", target: id })
      break
    case "unfeature":
      await db.feedback.update({ where: { id }, data: { featured: false } })
      await audit({ uid: session.uid, action: "feedback.unfeature", target: id })
      break
  }

  const updated = await db.feedback.findUnique({ where: { id } })
  return Response.json(serialize(updated))
})

export const DELETE = withErrors(async (req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const session = await readSessionFromCookie(req)
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    await db.feedback.delete({ where: { id } })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  await audit({ uid: session.uid, action: "feedback.delete", target: id })
  return Response.json({ ok: true })
})
