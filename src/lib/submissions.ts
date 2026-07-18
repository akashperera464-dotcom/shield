// Shared submissions store — used by the homepage Submit Project form (write)
// and by the admin Notifications panel (read / mark-as-read / status update).
// Persists to localStorage so the same browser session sees admin + client data.
// Firestore wiring lands later — the API below mirrors what a Firestore
// implementation would expose so the swap is drop-in.

import { DEMO_PROJECTS, type Project, type ProjectNote } from "@/data/demo";

const KEY = "theshield_submissions";
const STATUS_KEY = "theshield_submissions_meta"; // per-id meta: read flag, archived

export type SubmissionStatus = Project["status"]; // Pending | In Progress | Under Review | Completed

export interface SubmissionAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Submission {
  id: string;
  name: string;          // client name
  email: string;         // client email
  company?: string;      // optional
  service: string;       // selected service
  timeline?: string;     // optional
  brief: string;         // project description
  attachments: SubmissionAttachment[];
  status: SubmissionStatus;
  createdAt: string;     // ISO timestamp
  notes?: ProjectNote[]; // admin-added internal notes
}

export interface SubmissionMeta {
  readAt?: string;       // ISO timestamp when admin first opened it
  archived?: boolean;
}

type MetaMap = Record<string, SubmissionMeta>;

function loadMeta(): MetaMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as MetaMap) : {};
  } catch {
    return {};
  }
}

function saveMeta(meta: MetaMap): void {
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(meta));
  } catch {}
}

/** Load all submissions, newest first. Returns [] on server. */
export function loadSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Submission[];
  } catch {
    return [];
  }
}

function saveAllSubmissions(list: Submission[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

/** Insert a new submission at the top of the list. */
export function addSubmission(sub: Submission): void {
  const list = loadSubmissions();
  saveAllSubmissions([sub, ...list]);
}

/** Returns the number of submissions the admin hasn't opened yet. */
export function countUnread(): number {
  const meta = loadMeta();
  return loadSubmissions().filter((s) => !meta[s.id]?.readAt).length;
}

/** Mark a single submission as read (idempotent). */
export function markRead(id: string): void {
  const meta = loadMeta();
  if (!meta[id]) meta[id] = {};
  meta[id].readAt = new Date().toISOString();
  saveMeta(meta);
}

/** Mark every submission as read. */
export function markAllRead(): void {
  const meta = loadMeta();
  for (const s of loadSubmissions()) {
    if (!meta[s.id]) meta[s.id] = {};
    meta[s.id].readAt = new Date().toISOString();
  }
  saveMeta(meta);
}

/** Toggle archive flag — archived submissions are hidden from the inbox. */
export function setArchived(id: string, archived: boolean): void {
  const meta = loadMeta();
  if (!meta[id]) meta[id] = {};
  meta[id].archived = archived;
  saveMeta(meta);
}

/** Update the workflow status of a submission. */
export function updateStatus(id: string, status: SubmissionStatus): void {
  const list = loadSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status };
  saveAllSubmissions(list);
}

/** Attach an admin note to a submission. */
export function addNote(id: string, note: ProjectNote): void {
  const list = loadSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], notes: [...(list[idx].notes || []), note] };
  saveAllSubmissions(list);
}

/** Delete a submission permanently. */
export function deleteSubmission(id: string): void {
  saveAllSubmissions(loadSubmissions().filter((s) => s.id !== id));
  const meta = loadMeta();
  delete meta[id];
  saveMeta(meta);
}

/** Lookup metadata (read/archived) for a submission id. */
export function getMeta(id: string): SubmissionMeta {
  return loadMeta()[id] || {};
}

/** Seed a few demo submissions so the inbox isn't empty on first load. */
export function seedDemoSubmissions(): void {
  if (typeof window === "undefined") return;
  const existing = loadSubmissions();
  if (existing.length > 0) return;
  // Map the older DEMO_PROJECTS shape into our Submission shape so the admin
  // sees a populated inbox immediately.
  const seeded: Submission[] = DEMO_PROJECTS.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.clientName,
    email: p.clientEmail,
    company: "",
    service: p.projectTitle.split("—")[0].trim() || "Web Development",
    timeline: "",
    brief: p.description,
    attachments: p.attachments.map((a) => ({ name: a, url: a })),
    status: p.status,
    createdAt: p.createdAt,
    notes: p.notes,
  }));
  saveAllSubmissions(seeded);
}
