// Submissions store — thin client over the /api/submissions REST endpoints.
//
// Source of truth is MongoDB (via Prisma). localStorage is used ONLY as a
// read cache so the inbox UI renders instantly while the network call is
// in flight. Writes always hit the API and return the refreshed list.
//
// CRITICAL FIX (cross-device read/archived sync):
//   The read/archived state lives IN the Submission record itself (readAt +
//   archived fields), NOT in a separate localStorage key. Previously we kept
//   a separate `theshield_submissions_meta` localStorage key which was NEVER
//   synced across devices — so marking a submission "read" on phone didn't
//   reflect on desktop. Now `getMeta()` reads from the cached submission
//   record (which comes from MongoDB), and `markRead()` updates the DB then
//   refreshes the cache → cross-device sync works automatically on next poll.

import type { Project, ProjectNote } from "@/data/demo";

const KEY = "theshield_submissions";

export type SubmissionStatus = Project["status"];

export interface SubmissionAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  company?: string;
  service: string;
  timeline?: string;
  brief: string;
  attachments: SubmissionAttachment[];
  status: SubmissionStatus;
  createdAt: string;
  notes?: ProjectNote[];
  readAt?: string;
  archived?: boolean;
}

export interface SubmissionMeta {
  readAt?: string;
  archived?: boolean;
}

// Custom event — dispatched on `window` whenever the cache is refreshed
// from the API. Components in the SAME tab listen for this to update React
// state. The native storage event only fires in OTHER tabs.
export const SUBMISSIONS_UPDATED_EVENT = "theshield:submissions-updated";

// ── Cache helpers (sync) ─────────────────────────────────────────────
function readCache(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(list: Submission[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    // Dispatch BOTH a custom event (same-tab) AND a storage event (cross-tab).
    window.dispatchEvent(new CustomEvent(SUBMISSIONS_UPDATED_EVENT));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

// ── Network ──────────────────────────────────────────────────────────
// NOTE: returns null on failure (NOT []) so the caller knows NOT to wipe
// the cache. If we returned [] and the caller wrote that to cache, a single
// API hiccup would empty the inbox.
async function apiGet(): Promise<Submission[] | null> {
  try {
    const res = await fetch("/api/submissions", { cache: "no-store" });
    if (!res.ok) return null;
    if (res.status === 401) return null; // not authenticated
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function apiCreate(sub: Submission): Promise<Submission> {
  const res = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}

async function apiPatch(id: string, body: unknown): Promise<Submission | null> {
  const res = await fetch(`/api/submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json();
}

async function apiDelete(id: string): Promise<boolean> {
  const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
  return res.ok;
}

// ── Public API ───────────────────────────────────────────────────────

/** Load all submissions (cached, then background-refresh). Returns [] on server. */
export function loadSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  const cached = readCache();
  // Background refresh — caller listens to SUBMISSIONS_UPDATED_EVENT to get updates.
  apiGet()
    .then((list) => {
      if (list) writeCache(list);
    })
    .catch(() => {});
  return cached;
}

/**
 * Fetch fresh submissions from MongoDB and update the cache. Returns the
 * fresh list (or null if the fetch failed). Callers should update their
 * React state with the returned value to reflect cross-device changes.
 *
 * This is the function that makes submissions added/updated on Device A
 * actually appear on Device B when Device B loads the page.
 */
export async function refreshSubmissions(): Promise<Submission[] | null> {
  const fresh = await apiGet();
  if (Array.isArray(fresh)) {
    writeCache(fresh);
    return fresh;
  }
  return null;
}

/** Insert a new submission at the top of the list. Async — returns the new list. */
export async function addSubmission(sub: Submission): Promise<void> {
  // Optimistic insert
  const optimistic = [sub, ...readCache()];
  writeCache(optimistic);
  try {
    await apiCreate(sub);
    const fresh = await apiGet();
    if (fresh) writeCache(fresh);
  } catch (e) {
    // Rollback optimistic insert on failure
    writeCache(readCache().filter((s) => s.id !== sub.id));
    throw e;
  }
}

/**
 * Returns the number of submissions the admin hasn't opened yet.
 * Reads from the CACHED SUBMISSION LIST (which comes from MongoDB), not
 * from a separate localStorage meta key — so cross-device changes to
 * readAt are reflected automatically on next refresh.
 */
export function countUnread(): number {
  return readCache().filter((s) => !s.readAt).length;
}

/**
 * Lookup metadata (read/archived) for a submission id.
 * Reads from the cached submission record itself — NOT from a separate
 * localStorage key. This is the cross-device fix.
 */
export function getMeta(id: string): SubmissionMeta {
  const s = readCache().find((x) => x.id === id);
  if (!s) return {};
  return {
    readAt: s.readAt,
    archived: s.archived,
  };
}

/** Mark a single submission as read (idempotent). */
export async function markRead(id: string): Promise<void> {
  // Optimistic update on the cached list
  const list = readCache().map((s) =>
    s.id === id ? { ...s, readAt: new Date().toISOString() } : s
  );
  writeCache(list);
  await apiPatch(id, { kind: "read" });
  // Refresh from DB so cross-device state is consistent
  const fresh = await apiGet();
  if (fresh) writeCache(fresh);
}

/** Mark every submission as read. */
export async function markAllRead(): Promise<void> {
  const now = new Date().toISOString();
  const list = readCache().map((s) => ({ ...s, readAt: s.readAt || now }));
  writeCache(list);
  await Promise.all(list.map((s) => apiPatch(s.id, { kind: "read" })));
  const fresh = await apiGet();
  if (fresh) writeCache(fresh);
}

/** Toggle archive flag — archived submissions are hidden from the inbox. */
export async function setArchived(id: string, archived: boolean): Promise<void> {
  // Optimistic
  const list = readCache().map((s) => (s.id === id ? { ...s, archived } : s));
  writeCache(list);
  await apiPatch(id, { kind: "archive", archived });
  const fresh = await apiGet();
  if (fresh) writeCache(fresh);
}

/** Update the workflow status of a submission. */
export async function updateStatus(id: string, status: SubmissionStatus): Promise<void> {
  // Optimistic
  const list = readCache().map((s) => (s.id === id ? { ...s, status } : s));
  writeCache(list);
  await apiPatch(id, { kind: "status", status });
  const fresh = await apiGet();
  if (fresh) writeCache(fresh);
}

/** Attach an admin note to a submission. */
export async function addNote(id: string, note: ProjectNote): Promise<void> {
  await apiPatch(id, { kind: "note", note });
  const fresh = await apiGet();
  if (fresh) writeCache(fresh);
}

/** Delete a submission permanently. */
export async function deleteSubmission(id: string): Promise<void> {
  // Optimistic
  writeCache(readCache().filter((s) => s.id !== id));
  await apiDelete(id);
}

/**
 * Seed demo submissions via the API. Safe to call repeatedly (idempotent —
 * the API only inserts rows that don't exist by id). On the homepage we
 * call this once on first visit so the inbox isn't empty.
 */
export async function seedDemoSubmissions(): Promise<void> {
  if (typeof window === "undefined") return;
  // Only auto-seed once per browser to avoid hitting the endpoint on every visit.
  const flag = localStorage.getItem("theshield_seeded_submissions");
  if (flag) return;
  try {
    const res = await fetch("/api/seed", { method: "POST" });
    if (res.ok) {
      localStorage.setItem("theshield_seeded_submissions", "1");
      const fresh = await apiGet();
      if (fresh) writeCache(fresh);
    }
  } catch {
    // Swallow — seeding is best-effort.
  }
}
