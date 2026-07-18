// Helper: serializes MongoDB rows (BigInt, ObjectId, Date) into JSON-safe objects.
// Not strictly needed for our schema (we use String IDs everywhere), but kept
// as a safety net for Prisma's response shaping.
export function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

// Type for the unwrapped params object passed to route handlers.
// Next.js 15+ passes `params` as a Promise — we unwrap it before calling
// the user's handler, so inside the handler `params.id` works directly.
export type RouteParams = Record<string, string>

// Wraps an async route handler with try/catch + JSON error response.
// Prevents the API from crashing the Vercel function on unexpected throws.
//
// The wrapped handler receives (req, params) where `params` is a plain
// object (NOT a Promise). If there are no URL params, `params` is undefined.
export function withErrors(
  fn: (req: Request, params?: RouteParams) => Promise<Response>
) {
  return async (req: Request, ctx?: { params: Promise<RouteParams> }) => {
    try {
      const params = ctx?.params ? await ctx.params : undefined
      return await fn(req, params)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error'
      console.error('[API ERROR]', err)
      return Response.json({ error: message }, { status: 500 })
    }
  }
}
