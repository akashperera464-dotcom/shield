import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { TeamMember } from "@/data/demo"

// GET /api/team
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

// POST /api/team — create
export const POST = withErrors(async (req: Request) => {
  const body = (await req.json()) as Partial<TeamMember> & { password?: string }
  if (!body.uid || !body.name || !body.email || !body.role) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }
  // Unique check (email + username) — Prisma also enforces email unique at DB level.
  const existingEmail = await db.teamMember.findUnique({ where: { email: body.email } })
  if (existingEmail) {
    return Response.json({ error: "Another admin already uses this email." }, { status: 409 })
  }
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
    },
  })
  return Response.json(serialize(created), { status: 201 })
})
