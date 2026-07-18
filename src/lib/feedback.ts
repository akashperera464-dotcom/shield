// Shared client feedback (testimonials) store.
//
// Clients submit feedback from the homepage "Client love" section. New
// submissions land with status = "pending" and only appear on the public
// site once a superadmin approves them. Approved entries can additionally
// be marked "featured" to pin them to the top of the grid.
//
// Persists to localStorage so the same browser session sees admin + client
// data consistent. Firestore wiring lands later — the API below mirrors
// what a Firestore implementation would expose so the swap is drop-in.

export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface Feedback {
  id: string;
  name: string;           // client name (required)
  role: string;           // role + company, e.g. "CEO, Layla Cosmetics" (required)
  rating: number;         // 1-5 stars
  quote: string;          // the testimonial text (required, 10-500 chars)
  variant: "mint" | "violet" | "purple"; // drives avatar gradient — auto-assigned
  status: FeedbackStatus;
  featured: boolean;      // pinned to the top of the public grid
  createdAt: string;      // ISO timestamp
  source?: "seed" | "client"; // seed = pre-populated demo, client = real submission
}

const KEY = "theshield_feedback";

// Three demo testimonials so the section looks populated on first load.
// These mirror the original static TESTIMONIALS array so the visual is
// preserved exactly when no client feedback exists yet.
const SEED: Feedback[] = [
  {
    id: "fb_seed_1",
    name: "Sara Al-Mansoori",
    role: "CEO, Layla Cosmetics",
    rating: 5,
    quote:
      "The Shield took our Figma mess and shipped a polished React app in 5 weeks. The dashboard alone saved my team 12 hours a week.",
    variant: "mint",
    status: "approved",
    featured: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    source: "seed",
  },
  {
    id: "fb_seed_2",
    name: "Daniel Okafor",
    role: "COO, FleetIQ",
    rating: 5,
    quote:
      "The role-based admin panel is exactly what we needed. Superadmin can edit copy live, my ops team manages submissions — perfect.",
    variant: "violet",
    status: "approved",
    featured: false,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    source: "seed",
  },
  {
    id: "fb_seed_3",
    name: "Mei Tanaka",
    role: "Founder, Studio Mei",
    rating: 5,
    quote:
      "Submission was friction-free — one quick form and we got a clear scope back within 48 hours. The whole process felt senior.",
    variant: "purple",
    status: "approved",
    featured: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: "seed",
  },
];

function readRaw(): Feedback[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as Feedback[];
    if (!Array.isArray(parsed)) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return parsed;
  } catch {
    return SEED;
  }
}

function writeAll(list: Feedback[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    // Cross-tab + same-tab notification
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

/** Load ALL feedback (admin view). Newest first. */
export function loadAllFeedback(): Feedback[] {
  return [...readRaw()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Load only approved feedback for public display. Featured first, then newest. */
export function loadApprovedFeedback(): Feedback[] {
  return readRaw()
    .filter((f) => f.status === "approved")
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/** Count of pending feedback awaiting moderation. */
export function countPendingFeedback(): number {
  return readRaw().filter((f) => f.status === "pending").length;
}

/** Insert a new client-submitted feedback (status = pending). */
export function addFeedback(input: {
  name: string;
  role: string;
  rating: number;
  quote: string;
}): Feedback {
  const variants: Feedback["variant"][] = ["mint", "violet", "purple"];
  const fb: Feedback = {
    id: "fb_" + Math.random().toString(36).slice(2, 9),
    name: input.name.trim(),
    role: input.role.trim(),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    quote: input.quote.trim(),
    // Distribute variants by hash of name so the grid stays colorful
    variant: variants[
      Array.from(input.name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3
    ],
    status: "pending",
    featured: false,
    createdAt: new Date().toISOString(),
    source: "client",
  };
  const list = readRaw();
  writeAll([fb, ...list]);
  return fb;
}

/** Approve a pending feedback so it appears on the public site. */
export function approveFeedback(id: string): void {
  writeAll(readRaw().map((f) => (f.id === id ? { ...f, status: "approved" } : f)));
}

/** Reject a feedback (hidden from public, kept in admin for record). */
export function rejectFeedback(id: string): void {
  writeAll(readRaw().map((f) => (f.id === id ? { ...f, status: "rejected" } : f)));
}

/** Toggle the featured flag (only meaningful for approved items). */
export function toggleFeatured(id: string): void {
  writeAll(
    readRaw().map((f) =>
      f.id === id && f.status === "approved" ? { ...f, featured: !f.featured } : f
    )
  );
}

/** Permanently delete a feedback entry. */
export function deleteFeedback(id: string): void {
  writeAll(readRaw().filter((f) => f.id !== id));
}

/** Ensure the seed is present on first load. Safe to call repeatedly. */
export function seedFeedback(): void {
  if (typeof window === "undefined") return;
  const existing = readRaw();
  if (existing.length === 0) {
    writeAll(SEED);
  }
}
