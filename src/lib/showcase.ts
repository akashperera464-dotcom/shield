// Shared showcase storage — used by both HomeView (read) and SuperAdminView (CRUD).
// Persists to localStorage so admin edits are reflected on the public site instantly
// (same browser session). Firestore wiring lands later.

import { DEMO_SHOWCASE, type ShowcaseProject } from "@/data/demo";

const KEY = "theshield_showcase";

export function loadShowcase(): ShowcaseProject[] {
  if (typeof window === "undefined") return DEMO_SHOWCASE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(DEMO_SHOWCASE));
      return DEMO_SHOWCASE;
    }
    const parsed = JSON.parse(raw) as ShowcaseProject[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY, JSON.stringify(DEMO_SHOWCASE));
      return DEMO_SHOWCASE;
    }
    return parsed;
  } catch {
    return DEMO_SHOWCASE;
  }
}

export function saveShowcase(projects: ShowcaseProject[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {}
}

export function newShowcaseId(): string {
  return "sp_" + Math.random().toString(36).slice(2, 8);
}
