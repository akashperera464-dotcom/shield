import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { TeamMember } from "@/data/demo"

const SUPERADMIN_UID = "u_001"

// PATCH /api/team/[uid] — update existing team member.
// Superadmin (uid=u_001) role cannot be changed.
export const PATCH = withErrors(async (req: Request, params) => {
  const uid = params?.uid
  if (!uid) return Response.json({ error: "Missing uid" }, { status: 400 })

  const body = (await req.json()) as Partial<TeamMember> & { password?: string }
  const existing = await db.teamMember.findUnique({ where: { uid } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  // Email uniqueness check (if changing)
  if (body.email && body.email !== existing.email) {
    const clash = await db.teamMember.findUnique({ where: { email: body.email } })
    if (clash) return Response.json({ error: "Another admin already uses this email." }, { status: 409 })
  }

  const updated = await db.teamMember.update({
    where: { uid },
    data: {
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      // Lock superadmin role — no demotion, no promotion of others to superadmin
      role: uid === SUPERADMIN_UID ? "superadmin" : (body.role ?? existing.role),
      jobField: body.jobField ?? existing.jobField,
      mobile: body.mobile ?? existing.mobile,
      username: body.username ?? existing.username,
    },
  })
  return Response.json(serialize(updated))
})

// DELETE /api/team/[uid] — refuses to delete protected superadmin.
export const DELETE = withErrors(async (_req: Request, params) => {
  const uid = params?.uid
  if (!uid) return Response.json({ error: "Missing uid" }, { status: 400 })
  if (uid === SUPERADMIN_UID) {
    return Response.json({ error: "The superadmin account cannot be deleted." }, { status: 403 })
  }
  try {
    await db.teamMember.delete({ where: { uid } })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
})
