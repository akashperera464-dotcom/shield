// Feedback store — thin client over /api/feedback.
//
// Source of truth is MongoDB (Prisma). localStorage is used only as a
// read cache so the testimonials section renders instantly. Writes go
// through the API and refresh the cache.
//
// Cross-device sync pattern:
//   1. loadApprovedFeedback() / loadAllFeedback() return cached value instantly
//   2. refreshFeedback() fetches fresh data from MongoDB in the background
//   3. When fresh data arrives, cache is written AND a custom event
//      ('theshield:feedback-updated') is dispatched on `window`
//   4. Components listen for this event AND the native `storage` event
//      (which fires in OTHER tabs of the same browser)

export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface Feedback {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  variant: "mint" | "violet" | "purple";
  status: FeedbackStatus;
  featured: boolean;
  createdAt: string;
  source?: "seed" | "client";
}

const KEY = "theshield_feedback";
export const FEEDBACK_UPDATED_EVENT = "theshield:feedback-updated";

// ── Cache helpers ────────────────────────────────────────────────────
function readCache(): Feedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Feedback[]) : [];
  } catch {
    return [];
  }
}

function writeCache(list: Feedback[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    // Dispatch BOTH so same-tab React state + cross-tab listeners both fire.
    window.dispatchEvent(new CustomEvent(FEEDBACK_UPDATED_EVENT));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

// ── Network ──────────────────────────────────────────────────────────
// Returns null on failure so caller doesn't wipe the cache.
async function apiGet(scope: "all" | "approved" | "pending" = "approved"): Promise<Feedback[] | null> {
  try {
    const res = await fetch(`/api/feedback?scope=${scope}`, { cache: "no-store" });
    if (!res.ok) return null;
    if (res.status === 401) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function apiPatch(id: string, action: string): Promise<void> {
  await fetch(`/api/feedback/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

// ── Public API ───────────────────────────────────────────────────────

/** Load ALL feedback (admin view). Newest first. Uses cache, then refreshes. */
export function loadAllFeedback(): Feedback[] {
  const cached = readCache();
  apiGet("all").then((fresh) => { if (fresh) writeCache(fresh); }).catch(() => {});
  return cached.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Load only approved feedback for public display. Featured first, then newest. */
export function loadApprovedFeedback(): Feedback[] {
  const cached = readCache();
  apiGet("approved").then((fresh) => { if (fresh) writeCache(fresh); }).catch(() => {});
  return cached
    .filter((f) => f.status === "approved")
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/**
 * Fetch fresh feedback from MongoDB and update the cache. Returns the
 * fresh list (or null if fetch failed). Use this to reflect cross-device
 * changes (admin approves on phone → desktop updates on next call).
 */
export async function refreshFeedback(scope: "all" | "approved" = "approved"): Promise<Feedback[] | null> {
  const fresh = await apiGet(scope);
  if (Array.isArray(fresh)) {
    writeCache(fresh);
    return fresh;
  }
  return null;
}

/** Count of pending feedback awaiting moderation. */
export function countPendingFeedback(): number {
  return readCache().filter((f) => f.status === "pending").length;
}

/** Insert a new client-submitted feedback (status = pending). */
export async function addFeedback(input: {
  name: string;
  role: string;
  rating: number;
  quote: string;
}): Promise<Feedback> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to submit feedback" }));
    throw new Error(err.error || "Failed to submit feedback");
  }
  const created = (await res.json()) as Feedback;
  // Refresh cache so the new pending item shows up in admin queue
  const fresh = await apiGet("all");
  if (fresh) writeCache(fresh);
  return created;
}

/** Approve a pending feedback so it appears on the public site. */
export async function approveFeedback(id: string): Promise<void> {
  await apiPatch(id, "approve");
  const fresh = await apiGet("all");
  if (fresh) writeCache(fresh);
}

/** Reject a feedback (hidden from public, kept in admin for record). */
export async function rejectFeedback(id: string): Promise<void> {
  await apiPatch(id, "reject");
  const fresh = await apiGet("all");
  if (fresh) writeCache(fresh);
}

/** Toggle the featured flag (only meaningful for approved items). */
export async function toggleFeatured(id: string): Promise<void> {
  const current = readCache().find((f) => f.id === id);
  // Optimistic
  if (current && current.featured) {
    await apiPatch(id, "unfeature");
  } else {
    await apiPatch(id, "feature");
  }
  const fresh = await apiGet("all");
  if (fresh) writeCache(fresh);
}

/** Permanently delete a feedback entry. */
export async function deleteFeedback(id: string): Promise<void> {
  await fetch(`/api/feedback/${id}`, { method: "DELETE" });
  writeCache(readCache().filter((f) => f.id !== id));
}

/**
 * Ensure the seed feedback is present in MongoDB. Idempotent — only
 * fires the API call once per browser (subsequent visits skip it).
 */
export async function seedFeedback(): Promise<void> {
  if (typeof window === "undefined") return;
  const flag = localStorage.getItem("theshield_seeded_feedback");
  if (flag) {
    // Still refresh the cache so the homepage shows them.
    const fresh = await apiGet("approved");
    if (fresh) writeCache(fresh);
    return;
  }
  try {
    const res = await fetch("/api/seed", { method: "POST" });
    if (res.ok) {
      localStorage.setItem("theshield_seeded_feedback", "1");
      const fresh = await apiGet("approved");
      if (fresh) writeCache(fresh);
    }
  } catch {
    // swallow
  }
}
