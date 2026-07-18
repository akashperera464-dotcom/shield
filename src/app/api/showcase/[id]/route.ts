import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { ShowcaseProject } from "@/data/demo"

// PATCH /api/showcase/[id] — partial update (toggle featured, edit fields)
// DELETE /api/showcase/[id]
export const PATCH = withErrors(async (req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const body = (await req.json()) as Partial<ShowcaseProject>
  const existing = await db.showcase.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const updated = await db.showcase.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      category: body.category ?? existing.category,
      description: body.description ?? existing.description,
      imageUrl: body.imageUrl ?? existing.imageUrl,
      projectUrl: body.projectUrl ?? existing.projectUrl,
      tags: body.tags ?? (existing.tags as string[]),
      featured: body.featured ?? existing.featured,
      order: body.order ?? existing.order,
    },
  })
  return Response.json(serialize(updated))
})

export const DELETE = withErrors(async (_req: Request, params) => {
  const id = params?.id
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })
  try {
    await db.showcase.delete({ where: { id } })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
})
