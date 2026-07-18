// Showcase store — thin client over /api/showcase.
// MongoDB is the source of truth. localStorage is a read cache.

import type { ShowcaseProject } from "@/data/demo";

const KEY = "theshield_showcase";

function readCache(): ShowcaseProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShowcaseProject[]) : [];
  } catch {
    return [];
  }
}

function writeCache(list: ShowcaseProject[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

async function apiGet(): Promise<ShowcaseProject[]> {
  const res = await fetch("/api/showcase", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ShowcaseProject[];
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
  await fetch("/api/showcase", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects }),
  });
  writeCache(projects);
}

export function newShowcaseId(): string {
  return "sp_" + Math.random().toString(36).slice(2, 8);
}
