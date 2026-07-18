import { db } from "@/lib/db"
import { SEED_FEEDBACK, SEED_SHOWCASE, SEED_SUBMISSIONS, SEED_TEAM } from "@/lib/seed-data"
import { withErrors } from "@/lib/api-utils"

// POST /api/seed
// Idempotent — only inserts rows that don't already exist by id.
// Safe to call multiple times. Designed to be hit once after deploying to Vercel.
export const POST = withErrors(async () => {
  const result = {
    submissions: 0,
    feedback: 0,
    showcase: 0,
    team: 0,
    skipped: { submissions: 0, feedback: 0, showcase: 0, team: 0 },
  }

  // ── Submissions ──
  for (const s of SEED_SUBMISSIONS) {
    const exists = await db.submission.findUnique({ where: { id: s.id } })
    if (exists) { result.skipped.submissions++; continue }
    await db.submission.create({
      data: {
        id: s.id,
        name: s.name,
        email: s.email,
        company: s.company,
        service: s.service,
        timeline: s.timeline,
        brief: s.brief,
        attachments: s.attachments,
        status: s.status,
        createdAt: s.createdAt,
        notes: s.notes || [],
      },
    })
    result.submissions++
  }

  // ── Feedback ──
  for (const f of SEED_FEEDBACK) {
    const exists = await db.feedback.findUnique({ where: { id: f.id } })
    if (exists) { result.skipped.feedback++; continue }
    await db.feedback.create({
      data: {
        id: f.id,
        name: f.name,
        role: f.role,
        rating: f.rating,
        quote: f.quote,
        variant: f.variant,
        status: f.status,
        featured: f.featured,
        createdAt: f.createdAt,
        source: f.source,
      },
    })
    result.feedback++
  }

  // ── Showcase ──
  for (const p of SEED_SHOWCASE) {
    const exists = await db.showcase.findUnique({ where: { id: p.id } })
    if (exists) { result.skipped.showcase++; continue }
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
    result.showcase++
  }

  // ── Team ──
  for (const t of SEED_TEAM) {
    const exists = await db.teamMember.findUnique({ where: { uid: t.uid } })
    if (exists) { result.skipped.team++; continue }
    await db.teamMember.create({
      data: {
        uid: t.uid,
        name: t.name,
        email: t.email,
        role: t.role,
        createdAt: t.createdAt,
        jobField: t.jobField,
        mobile: t.mobile,
        username: t.username,
      },
    })
    result.team++
  }

  return Response.json({ ok: true, ...result })
})
