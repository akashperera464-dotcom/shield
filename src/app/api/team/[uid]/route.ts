import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import { hashPassword } from "@/lib/password"
import type { TeamMember } from "@/data/demo"

const SUPERADMIN_UID = "u_001"

// PATCH /api/team/[uid] — update existing team member.
// Superadmin (uid=u_001) role cannot be changed.
// Optional `password` field — if provided and non-empty, re-hashes + stores.
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

  // Optionally hash + store a new password
  let newPasswordHash: string | undefined
  if (body.password && body.password.length > 0) {
    if (body.password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }
    newPasswordHash = await hashPassword(body.password)
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
      ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
    },
  })
  // Strip passwordHash before returning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _omit, ...safe } = updated
  return Response.json(serialize(safe))
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
