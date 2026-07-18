// Client-side helper for fetching + caching the global SiteConfig.
// Used by HomeView (read-only) and SuperAdminView CMS panel (read+write).

import { DEMO_CONFIG, type SiteConfig } from "@/data/demo";

const CACHE_KEY = "theshield_siteconfig";
const CACHE_TTL_MS = 60_000; // 1 minute

export type SiteConfigWithMeta = SiteConfig & { updatedAt?: string };

function readCache(): SiteConfigWithMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: SiteConfigWithMeta; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: SiteConfigWithMeta) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function clearConfigCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

/**
 * Fetches the global site config from the API.
 * Returns DEMO_CONFIG as a fallback if the API is unreachable.
 */
export async function fetchSiteConfig(): Promise<SiteConfigWithMeta> {
  // Try cache first (fast path)
  const cached = readCache();
  if (cached) return cached;

  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as SiteConfigWithMeta;
    writeCache(data);
    return data;
  } catch {
    // Degrade gracefully — never crash the homepage over a settings fetch failure
    return { ...DEMO_CONFIG };
  }
}

/**
 * Saves the global site config. Clears the cache so the next fetch picks up
 * the new values immediately.
 */
export async function saveSiteConfig(
  data: SiteConfig
): Promise<SiteConfigWithMeta> {
  const res = await fetch("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Save failed" }));
    throw new Error(err.error || "Failed to save site config");
  }
  const saved = (await res.json()) as SiteConfigWithMeta;
  writeCache(saved);
  return saved;
}
