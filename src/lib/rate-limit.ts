// In-memory rate limiter for login endpoint.
//
// Why in-memory and not Redis? On Vercel serverless, each invocation may
// run in a different Lambda, so an in-memory limiter is per-instance.
// That's still useful: a single attacker hitting one warm Lambda gets
// throttled. For full distributed rate-limiting you'd need Upstash Redis
// or Vercel KV — out of scope for now.
//
// Policy:
//   • 5 failed logins per (ip + email) per 15-minute window → 429 with
//     "Too many attempts. Try again in X minutes."
//   • Successful logins clear the counter for that key.
//   • Entries older than the window are garbage-collected on each call.

interface Attempt {
  count: number;
  firstAt: number;
  lastAt: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const store = new Map<string, Attempt>();

function key(ip: string, email: string): string {
  return `${ip || "unknown"}::${(email || "").toLowerCase()}`;
}

function ipOf(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

/** Returns true if this (ip, email) is currently rate-limited. */
export function isRateLimited(req: Request, email: string): {
  limited: boolean;
  retryAfterMs: number;
} {
  const k = key(ipOf(req), email);
  const now = Date.now();
  const a = store.get(k);
  if (!a) return { limited: false, retryAfterMs: 0 };
  // Window expired → reset
  if (now - a.firstAt > WINDOW_MS) {
    store.delete(k);
    return { limited: false, retryAfterMs: 0 };
  }
  if (a.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - a.firstAt);
    return { limited: true, retryAfterMs: Math.max(0, retryAfterMs) };
  }
  return { limited: false, retryAfterMs: 0 };
}

/** Record a failed login attempt for this (ip, email). */
export function recordFailure(req: Request, email: string): void {
  const k = key(ipOf(req), email);
  const now = Date.now();
  const a = store.get(k);
  if (!a || now - a.firstAt > WINDOW_MS) {
    store.set(k, { count: 1, firstAt: now, lastAt: now });
    return;
  }
  a.count += 1;
  a.lastAt = now;
  store.set(k, a);
}

/** Clear the counter on successful login. */
export function recordSuccess(req: Request, email: string): void {
  store.delete(key(ipOf(req), email));
}
