import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { ShowcaseProject } from "@/data/demo"

// GET /api/showcase
export const GET = withErrors(async () => {
  const rows = await db.showcase.findMany({ orderBy: [{ featured: "desc" }, { order: "asc" }] })
  const items: ShowcaseProject[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    imageUrl: r.imageUrl,
    projectUrl: r.projectUrl,
    tags: (r.tags as string[]) || [],
    featured: r.featured,
    order: r.order,
  }))
  return Response.json(serialize(items))
})

// POST /api/showcase — create
// PUT  /api/showcase — replace all (used by SuperAdmin bulk save)
export const POST = withErrors(async (req: Request) => {
  const body = (await req.json()) as Partial<ShowcaseProject>
  if (!body.id || !body.title || !body.category) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }
  const created = await db.showcase.create({
    data: {
      id: body.id,
      title: body.title,
      category: body.category,
      description: body.description || "",
      imageUrl: body.imageUrl || "",
      projectUrl: body.projectUrl || "",
      tags: body.tags || [],
      featured: body.featured || false,
      order: body.order || 0,
    },
  })
  return Response.json(serialize(created), { status: 201 })
})

// Bulk-replace: pass { projects: ShowcaseProject[] } in body.
export const PUT = withErrors(async (req: Request) => {
  const body = (await req.json()) as { projects?: ShowcaseProject[] }
  if (!Array.isArray(body.projects)) {
    return Response.json({ error: "Expected { projects: [...] }" }, { status: 400 })
  }
  // Wipe + recreate. For larger datasets this would be a transaction, but
  // the showcase list is small (max ~50 entries) so a simple replace is fine.
  await db.showcase.deleteMany({})
  for (const p of body.projects) {
    await db.showcase.create({
      data: {
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        projectUrl: p.projectUrl,
        tags: p.tags,
        featured: p.featured,
        order: p.order,
      },
    })
  }
  return Response.json({ ok: true, count: body.projects.length })
})
