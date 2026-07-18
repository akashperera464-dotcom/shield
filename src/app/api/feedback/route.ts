import { db } from "@/lib/db"
import { withErrors, serialize } from "@/lib/api-utils"
import { readSessionFromCookie } from "@/lib/auth"
import { audit } from "@/lib/audit"
import type { Feedback } from "@/lib/feedback"

// GET /api/feedback?scope=all|approved|pending
// - scope=approved (default): public — for homepage
// - scope=all|pending: admin-only — requires session
export const GET = withErrors(async (req: Request) => {
  const url = new URL(req.url)
  const scope = url.searchParams.get("scope") || "approved"

  // Auth gate for admin-only scopes
  if (scope === "all" || scope === "pending") {
    const session = await readSessionFromCookie(req)
    if (!session) {
      return Response.json({ error: "Authentication required" }, { status: 401 })
    }
  }

  let rows
  if (scope === "all") {
    rows = await db.feedback.findMany({ orderBy: { createdAt: "desc" } })
  } else if (scope === "pending") {
    rows = await db.feedback.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    })
  } else {
    // approved — featured first, then newest
    rows = await db.feedback.findMany({
      where: { status: "approved" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    })
  }

  const items: Feedback[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    rating: r.rating,
    quote: r.quote,
    variant: r.variant as Feedback["variant"],
    status: r.status as Feedback["status"],
    featured: r.featured,
    createdAt: r.createdAt,
    source: (r.source as Feedback["source"]) || "client",
  }))
  return Response.json(serialize(items))
})

// POST /api/feedback  — body: { name, role, rating, quote }
// Creates a new client-submitted feedback (status=pending).
// PUBLIC endpoint.
export const POST = withErrors(async (req: Request) => {
  const body = await req.json() as {
    name?: string
    role?: string
    rating?: number
    quote?: string
  }
  const name = (body.name || "").trim()
  const role = (body.role || "").trim()
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)))
  const quote = (body.quote || "").trim()

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 })
  if (!role) return Response.json({ error: "Role is required" }, { status: 400 })
  if (quote.length < 10) return Response.json({ error: "Quote too short" }, { status: 400 })

  const variants: Feedback["variant"][] = ["mint", "violet", "purple"]
  const variant = variants[
    Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3
  ]

  const created = await db.feedback.create({
    data: {
      id: "fb_" + Math.random().toString(36).slice(2, 9),
      name,
      role,
      rating,
      quote,
      variant,
      status: "pending",
      featured: false,
      createdAt: new Date().toISOString(),
      source: "client",
    },
  })
  // Audit as "system" — public submission
  await audit({
    uid: "system",
    action: "feedback.create",
    target: created.id,
    meta: { name, role, rating },
  })
  // Analytics event
  try {
    await db.analyticsEvent.create({
      data: {
        id: "ae_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        kind: "feedback_submit",
        path: null,
        referrer: null,
        ua: (req.headers.get("user-agent") || "").slice(0, 500),
        ip: (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "").slice(0, 100),
        createdAt: new Date().toISOString(),
      },
    })
  } catch {}
  return Response.json(serialize(created), { status: 201 })
})
