// Submissions store — thin client over the /api/submissions REST endpoints.
//
// Source of truth is MongoDB (via Prisma). localStorage is used only as a
// read cache so the inbox UI renders instantly while the network call is
// in flight. Writes always hit the API and return the refreshed list.
//
// All functions remain synchronous in shape for read paths (they return
// the cached value immediately and trigger a background refresh that the
// caller can opt into via the `subscribe` pattern).

import type { Project, ProjectNote } from "@/data/demo";

const KEY = "theshield_submissions";
const STATUS_KEY = "theshield_submissions_meta";

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
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

function readMeta(): Record<string, SubmissionMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Network ──────────────────────────────────────────────────────────
async function apiGet(): Promise<Submission[]> {
  const res = await fetch("/api/submissions", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as Submission[];
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

// ── Public API (drop-in compatible with old localStorage version) ─────

/** Load all submissions (cached, then background-refresh). Returns [] on server. */
export function loadSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  const cached = readCache();
  // Background refresh — caller listens to storage event to get updates.
  apiGet().then((list) => writeCache(list)).catch(() => {});
  return cached;
}

/** Insert a new submission at the top of the list. Async — returns the new list. */
export async function addSubmission(sub: Submission): Promise<void> {
  // Optimistic insert
  const optimistic = [sub, ...readCache()];
  writeCache(optimistic);
  try {
    await apiCreate(sub);
    const fresh = await apiGet();
    writeCache(fresh);
  } catch (e) {
    // Rollback optimistic insert on failure
    writeCache(readCache().filter((s) => s.id !== sub.id));
    throw e;
  }
}

/** Returns the number of submissions the admin hasn't opened yet. */
export function countUnread(): number {
  const meta = readMeta();
  return readCache().filter((s) => !meta[s.id]?.readAt && !s.readAt).length;
}

/** Mark a single submission as read (idempotent). */
export async function markRead(id: string): Promise<void> {
  const meta = readMeta();
  if (!meta[id]) meta[id] = {};
  meta[id].readAt = new Date().toISOString();
  if (typeof window !== "undefined") {
    localStorage.setItem(STATUS_KEY, JSON.stringify(meta));
  }
  await apiPatch(id, { kind: "read" });
}

/** Mark every submission as read. */
export async function markAllRead(): Promise<void> {
  const meta = readMeta();
  const list = readCache();
  for (const s of list) {
    if (!meta[s.id]) meta[s.id] = {};
    meta[s.id].readAt = new Date().toISOString();
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STATUS_KEY, JSON.stringify(meta));
  }
  await Promise.all(list.map((s) => apiPatch(s.id, { kind: "read" })));
}

/** Toggle archive flag — archived submissions are hidden from the inbox. */
export async function setArchived(id: string, archived: boolean): Promise<void> {
  await apiPatch(id, { kind: "archive", archived });
  const fresh = await apiGet();
  writeCache(fresh);
}

/** Update the workflow status of a submission. */
export async function updateStatus(id: string, status: SubmissionStatus): Promise<void> {
  // Optimistic
  const list = readCache().map((s) => (s.id === id ? { ...s, status } : s));
  writeCache(list);
  await apiPatch(id, { kind: "status", status });
}

/** Attach an admin note to a submission. */
export async function addNote(id: string, note: ProjectNote): Promise<void> {
  await apiPatch(id, { kind: "note", note });
  const fresh = await apiGet();
  writeCache(fresh);
}

/** Delete a submission permanently. */
export async function deleteSubmission(id: string): Promise<void> {
  // Optimistic
  writeCache(readCache().filter((s) => s.id !== id));
  await apiDelete(id);
}

/** Lookup metadata (read/archived) for a submission id. */
export function getMeta(id: string): SubmissionMeta {
  return readMeta()[id] || {};
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
      writeCache(fresh);
    }
  } catch {
    // Swallow — seeding is best-effort.
  }
}
