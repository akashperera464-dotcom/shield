import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import type { ShowcaseProject } from "@/data/demo"

// Helper: coerce unknown → ShowcaseProject with safe defaults.
// Prevents malformed admin payloads (missing tags, null order, etc.)
// from corrupting the DB and crashing the public homepage render.
function normalizeProject(raw: unknown): ShowcaseProject {
  const r = (raw ?? {}) as Partial<ShowcaseProject> & Record<string, unknown>
  let tags: string[] = []
  const t = r.tags as unknown
  if (Array.isArray(t)) {
    tags = t.map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim())).filter(Boolean)
  } else if (typeof t === "string" && t.trim()) {
    tags = t.split(",").map((x) => x.trim()).filter(Boolean)
  }
  const order =
    typeof r.order === "number" && Number.isFinite(r.order)
      ? r.order
      : Number.parseInt(String(r.order ?? "0"), 10) || 0
  return {
    id: typeof r.id === "string" && r.id ? r.id : "sp_" + Math.random().toString(36).slice(2, 8),
    title: typeof r.title === "string" ? r.title : "",
    category: typeof r.category === "string" ? r.category : "Other",
    description: typeof r.description === "string" ? r.description : "",
    imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : "",
    projectUrl: typeof r.projectUrl === "string" ? r.projectUrl : "",
    tags,
    featured: Boolean(r.featured),
    order,
  }
}

// GET /api/showcase
export const GET = withErrors(async () => {
  const rows = await db.showcase.findMany({ orderBy: [{ featured: "desc" }, { order: "asc" }] })
  const items: ShowcaseProject[] = rows.map((r) =>
    normalizeProject({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      imageUrl: r.imageUrl,
      projectUrl: r.projectUrl,
      tags: r.tags,
      featured: r.featured,
      order: r.order,
    })
  )
  return Response.json(serialize(items))
})

// POST /api/showcase — create
// PUT  /api/showcase — replace all (used by SuperAdmin bulk save)
export const POST = withErrors(async (req: Request) => {
  const body = (await req.json()) as Partial<ShowcaseProject>
  const p = normalizeProject(body)
  if (!p.title || !p.category) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }
  const created = await db.showcase.create({
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
  return Response.json(serialize(created), { status: 201 })
})

// Bulk-replace: pass { projects: ShowcaseProject[] } in body.
export const PUT = withErrors(async (req: Request) => {
  const body = (await req.json()) as { projects?: unknown }
  if (!Array.isArray(body.projects)) {
    return Response.json({ error: "Expected { projects: [...] }" }, { status: 400 })
  }
  // Normalize every project before writing so bad shape never lands in Mongo.
  const projects: ShowcaseProject[] = body.projects.map(normalizeProject)
  // Wipe + recreate. For larger datasets this would be a transaction, but
  // the showcase list is small (max ~50 entries) so a simple replace is fine.
  await db.showcase.deleteMany({})
  for (const p of projects) {
    try {
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
    } catch (err) {
      // Log + continue — a single bad row should NOT abort the entire
      // bulk save (which would wipe the DB and leave it empty).
      console.error("[PUT /api/showcase] failed to insert", p.id, err)
    }
  }
  return Response.json({ ok: true, count: projects.length })
})
