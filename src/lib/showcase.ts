// Showcase store — thin client over /api/showcase.
// MongoDB is the source of truth. localStorage is a read cache.
//
// All data loaded from cache OR API is normalized via `normalizeProject`
// before being returned to the UI. This guarantees every ShowcaseProject
// has well-typed fields (tags is always an array, order is always a number,
// strings are never undefined). Without this, a single malformed row in
// MongoDB or in an older localStorage cache could throw `undefined.length`
// inside ShowcaseCard and crash the entire homepage render.

import type { ShowcaseProject } from "@/data/demo";

const KEY = "theshield_showcase";

/**
 * Coerce an unknown shape into a valid ShowcaseProject.
 * Missing fields are filled with safe defaults so the UI never sees
 * undefined / null where it expects a string, array, or number.
 *
 * This is the single source of truth for "what a showcase project looks
 * like at runtime" — every code path (cache, API, admin form output)
 * funnels through here on read.
 */
export function normalizeProject(raw: unknown): ShowcaseProject {
  const r = (raw ?? {}) as Partial<ShowcaseProject> & Record<string, unknown>;

  // Tags: accept string[] or a comma-separated string (legacy). Anything
  // else becomes [].
  let tags: string[] = [];
  const rawTags = r.tags as unknown;
  if (Array.isArray(rawTags)) {
    tags = rawTags
      .map((t) => (typeof t === "string" ? t.trim() : String(t ?? "").trim()))
      .filter(Boolean);
  } else if (typeof rawTags === "string" && rawTags.trim()) {
    tags = rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const order =
    typeof r.order === "number" && Number.isFinite(r.order)
      ? r.order
      : Number.parseInt(String(r.order ?? "0"), 10) || 0;

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
  };
}

function readCache(): ShowcaseProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProject);
  } catch {
    return [];
  }
}

function writeCache(list: ShowcaseProject[]) {
  if (typeof window === "undefined") return;
  try {
    // Always write normalized data — protects against future schema drift.
    const normalized = list.map(normalizeProject);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

async function apiGet(): Promise<ShowcaseProject[]> {
  const res = await fetch("/api/showcase", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeProject);
}

/** Load all showcase projects. Featured first, then by order. Cache + refresh. */
export function loadShowcase(): ShowcaseProject[] {
  const cached = readCache();
  apiGet().then(writeCache).catch(() => {});
  return cached.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (a.order || 0) - (b.order || 0);
  });
}

/**
 * Bulk-replace the entire showcase list. Used by SuperAdmin when
 * editing/adding/deleting cards — the admin saves the whole list at once.
 */
export async function saveShowcase(projects: ShowcaseProject[]): Promise<void> {
  // Normalize before saving so we never persist bad shape to Mongo or cache.
  const normalized = projects.map(normalizeProject);
  await fetch("/api/showcase", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects: normalized }),
  });
  writeCache(normalized);
}

export function newShowcaseId(): string {
  return "sp_" + Math.random().toString(36).slice(2, 8);
}
