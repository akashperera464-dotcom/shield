import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import { hashPassword } from "@/lib/password"
import type { TeamMember } from "@/data/demo"

// GET /api/team — returns all team members (passwordHash never included).
export const GET = withErrors(async () => {
  const rows = await db.teamMember.findMany({ orderBy: { createdAt: "asc" } })
  const items: TeamMember[] = rows.map((r) => ({
    uid: r.uid,
    name: r.name,
    email: r.email,
    role: r.role as TeamMember["role"],
    createdAt: r.createdAt,
    jobField: r.jobField || undefined,
    mobile: r.mobile || undefined,
    username: r.username || undefined,
  }))
  return Response.json(serialize(items))
})

// POST /api/team — create a new admin. Requires `password` (plaintext, will be hashed).
export const POST = withErrors(async (req: Request) => {
  const body = (await req.json()) as Partial<TeamMember> & { password?: string }
  if (!body.uid || !body.name || !body.email || !body.role) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (!body.password || body.password.length < 6) {
    return Response.json({ error: "Password is required (min 6 characters)." }, { status: 400 })
  }
  // Unique check (email + username) — Prisma also enforces email unique at DB level.
  const existingEmail = await db.teamMember.findUnique({ where: { email: body.email } })
  if (existingEmail) {
    return Response.json({ error: "Another admin already uses this email." }, { status: 409 })
  }
  const passwordHash = await hashPassword(body.password)
  const created = await db.teamMember.create({
    data: {
      uid: body.uid,
      name: body.name,
      email: body.email,
      role: body.role,
      createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
      jobField: body.jobField || null,
      mobile: body.mobile || null,
      username: body.username || null,
      passwordHash,
    },
  })
  // Strip passwordHash before returning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _omit, ...safe } = created
  return Response.json(serialize(safe), { status: 201 })
})
