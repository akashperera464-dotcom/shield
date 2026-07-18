"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Settings,
  Users,
  Image as ImageIcon,
  Link2,
  Save,
  Plus,
  Mail,
  Lock,
  User,
  Trash2,
  Eye,
  EyeOff,
  Home as HomeIcon,
  LayoutDashboard,
  Activity,
  BarChart3,
  HardDrive,
  ChevronRight,
  Phone,
  Briefcase,
  AtSign,
  Pencil,
  X,
  FolderKanban,
  ExternalLink,
  Star,
  ArrowUp,
  ArrowDown,
  Tag,
  Bell,
  MessageSquare,
  Download,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DEMO_CONFIG,
  SHOWCASE_CATEGORIES,
  type SiteConfig,
  type TeamMember,
  type ShowcaseProject,
} from "@/data/demo";
import { GradientAvatar, MiniAreaChart, CircularGauge } from "./Charts";
import { loadShowcase, saveShowcase, newShowcaseId } from "@/lib/showcase";
import { fetchSiteConfig, saveSiteConfig, clearConfigCache } from "@/lib/config";
import NotificationsPanel from "./NotificationsPanel";
import FeedbackPanel from "./FeedbackPanel";

// ── Analytics fetcher + types ──────────────────────────────────────────
// Lives here (not in a separate lib) because the shape is only consumed
// by this component. If other components need it later, move to lib/analytics.ts.
interface AnalyticsResponse {
  pageviews: {
    total: number;
    last30d: number;
    uniqueVisitors30d: number;
    series30d: number[];
    growthPct: number;
  };
  submissions: { total: number; last30d: number };
  feedback: { total: number; last30d: number };
  showcase: { total: number; clicks30d: number };
  engagement: {
    satisfactionPct: number;
    completionPct: number;
    avgRating: number;
    referralPct: number;
  };
  storage: {
    submissions: number;
    feedback: number;
    showcase: number;
    team: number;
    sessions: number;
    activityLog: number;
    analyticsEvents: number;
    totalDocuments: number;
  };
  series7d: { label: string; pageviews: number; uniqueVisitors: number; submissions: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch("/api/analytics", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load analytics");
  return (await res.json()) as AnalyticsResponse;
}

interface ActivityEntry {
  id: string;
  uid: string;
  actorName: string;
  actorEmail: string;
  actorRole: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

const SIDEBAR_NAV = [
  { id: "home",       label: "Back to site",    icon: HomeIcon },
  { id: "dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { id: "cms",        label: "CMS Settings",    icon: Settings },
  { id: "projects",   label: "Projects",        icon: FolderKanban },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "feedback",   label: "Feedback",        icon: MessageSquare },
  { id: "team",       label: "User Management", icon: Users },
  { id: "analytics",  label: "Analytics",       icon: Activity },
  { id: "storage",    label: "Storage",         icon: HardDrive },
  { id: "activity",   label: "Activity Log",    icon: BarChart3 },
  { id: "security",   label: "Security",        icon: Lock },
] as const;

type TabId = "cms" | "projects" | "notifications" | "feedback" | "team" | "analytics" | "storage" | "activity" | "security";

export default function SuperAdminView() {
  const { profile, setView } = useAuth();
  const [tab, setTab] = useState<TabId>("cms");
  const [teamCount, setTeamCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState<number>(0);
  const [storageTotal, setStorageTotal] = useState<number>(0);

  // Live counts for sidebar badges — refreshed every 30s and on every
  // mutation event. Pulls from the same MongoDB-backed libs the rest of
  // the app uses, so cross-device changes show up here too.
  useEffect(() => {
    let cancelled = false;
    const pullCounts = async () => {
      if (cancelled) return;
      try {
        const [teamRes, subRes, fbRes, anRes] = await Promise.all([
          fetch("/api/team", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/submissions", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/feedback?scope=all", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/analytics", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (cancelled) return;
        setTeamCount(Array.isArray(teamRes) ? teamRes.length : 0);
        setUnreadCount(Array.isArray(subRes) ? subRes.filter((s: { readAt?: string }) => !s.readAt).length : 0);
        setPendingFeedbackCount(Array.isArray(fbRes) ? fbRes.filter((f: { status: string }) => f.status === "pending").length : 0);
        if (anRes && typeof anRes === "object" && "storage" in anRes) {
          setStorageTotal((anRes as { storage: { totalDocuments: number } }).storage.totalDocuments);
        }
      } catch {
        // swallow — counts are best-effort
      }
    };
    pullCounts();
    const interval = setInterval(pullCounts, 30000);
    // Also re-pull when any data channel updates (custom events from libs)
    const onSub = () => pullCounts();
    const onFb = () => pullCounts();
    const onShowcase = () => pullCounts();
    window.addEventListener("theshield:submissions-updated", onSub);
    window.addEventListener("theshield:feedback-updated", onFb);
    window.addEventListener("theshield:showcase-updated", onShowcase);
    window.addEventListener("storage", onSub);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("theshield:submissions-updated", onSub);
      window.removeEventListener("theshield:feedback-updated", onFb);
      window.removeEventListener("theshield:showcase-updated", onShowcase);
      window.removeEventListener("storage", onSub);
    };
  }, []);

  const handleNav = (id: string) => {
    if (id === "home") return setView("home");
    if (id === "dashboard") return setView("dashboard");
    setTab(id as TabId);
  };

  return (
    <div className="relative mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6 overflow-x-clip-mobile">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ─────────── SIDEBAR (desktop only, lg+) ─────────── */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)]">
          <div className="glass-card flex h-full flex-col p-4">
            {/* User greeting */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-violet-600/15 via-navy-800/60 to-mint-300/10 p-4">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-600/20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <GradientAvatar
                  initial={(profile?.name || "S").charAt(0)}
                  size={42}
                  variant="violet"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {profile?.name || "Superadmin"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-violet-300">
                    {profile?.role}
                  </div>
                </div>
                <Shield className="h-4 w-4 text-violet-300" />
              </div>
              <div className="relative mt-3 flex items-center gap-2 text-[10px] text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  online
                </span>
                <span>·</span>
                <span>live</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="mt-4 flex flex-col gap-1">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                Superadmin
              </div>
              {SIDEBAR_NAV.map((item) => {
                const isActive =
                  (item.id === "cms" && tab === "cms") ||
                  (item.id === "projects" && tab === "projects") ||
                  (item.id === "notifications" && tab === "notifications") ||
                  (item.id === "feedback" && tab === "feedback") ||
                  (item.id === "team" && tab === "team") ||
                  (item.id === "analytics" && tab === "analytics") ||
                  (item.id === "storage" && tab === "storage") ||
                  (item.id === "activity" && tab === "activity") ||
                  (item.id === "security" && tab === "security");
                const unread = item.id === "notifications" ? unreadCount : 0;
                const pendingFb = item.id === "feedback" ? pendingFeedbackCount : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "team" && teamCount > 0 && (
                      <span className="rounded-md bg-violet-600/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                        {teamCount}
                      </span>
                    )}
                    {item.id === "notifications" && unread > 0 && (
                      <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                        {unread}
                      </span>
                    )}
                    {item.id === "feedback" && pendingFb > 0 && (
                      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {pendingFb}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Storage tile — real document count from MongoDB */}
            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500">
                  <HardDrive className="h-3 w-3 text-mint-300" /> Documents
                </div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {storageTotal}
                  <span className="text-sm font-normal text-ink-400"> docs</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-300 to-violet-600 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (storageTotal / 5000) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-ink-500">
                  Atlas free tier · 512MB
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─────────── MAIN ─────────── */}
        <main className="min-w-0">
          {/* Mobile user strip + horizontal pill nav (replaces sidebar on < lg) */}
          <div className="mb-4 lg:hidden">
            <div className="glass-card mb-3 flex items-center gap-3 p-3">
              <GradientAvatar
                initial={(profile?.name || "S").charAt(0)}
                size={36}
                variant="violet"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {profile?.name || "Superadmin"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-violet-300">
                  {profile?.role}
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[10px] text-ink-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                live
              </div>
            </div>
            <div className="no-scrollbar -mx-3 overflow-x-auto px-3">
              <div className="mobile-pill-bar">
                {SIDEBAR_NAV.filter((i) => i.id !== "home" && i.id !== "dashboard").map((item) => {
                  const isActive = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`mobile-nav-pill ${isActive ? "active" : ""}`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-300">
                <Shield className="h-3.5 w-3.5" /> Superadmin Console
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Console <span className="text-gradient-animated">overview</span>
              </h1>
              <p className="mt-1 truncate text-sm text-ink-400">
                Signed in as <span className="font-mono text-mint-300">{profile?.email}</span>
              </p>
            </div>
            <button onClick={() => setView("dashboard")} className="btn-ghost text-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick stats row — real numbers from /api/analytics */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Team Members" value={teamCount} icon={Users} color="#64ffda" />
            <StatTile label="Unread Subs" value={unreadCount} icon={Bell} color="#f43f5e" />
            <StatTile label="Pending Fb" value={pendingFeedbackCount} icon={MessageSquare} color="#fbbf24" />
            <StatTile label="Total Docs" value={storageTotal} icon={HardDrive} color="#9d8df1" />
          </div>

          {/* Content area */}
          <div className="mt-6">
            {tab === "cms" && <CMSPanel />}
            {tab === "projects" && <ShowcasePanel />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "feedback" && <FeedbackPanel />}
            {tab === "team" && <TeamPanel />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "storage" && <StoragePanel />}
            {tab === "activity" && <ActivityPanel />}
            {tab === "security" && <SecurityPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div className="glass-card-hover p-4 animate-fade-up sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/10">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function CMSPanel() {
  const [form, setForm] = useState<SiteConfig>(DEMO_CONFIG);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load live config from MongoDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchSiteConfig();
      if (cancelled) return;
      setForm(data);
      setLastUpdated(data.updatedAt ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const saved = await saveSiteConfig(form);
      setForm(saved);
      setLastUpdated(saved.updatedAt ?? null);
      clearConfigCache(); // force other tabs/components to refetch
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to save settings.";
      setError(m);
    } finally {
      setBusy(false);
    }
  };

  const isValidUrl = (u: string) => /^https?:\/\/.+/.test(u);

  if (loading) {
    return (
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/20 border-t-mint-300" />
          Loading site configuration…
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSave} className="glass-card p-4 sm:p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Site content</h2>
            <p className="mt-1 text-sm text-ink-400">
              Edit the{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">
                siteConfig/global
              </code>{" "}
              document. Changes go live instantly on the public site.
            </p>
          </div>
          {lastUpdated && (
            <div className="hidden text-right text-[10px] text-ink-500 sm:block">
              <div className="uppercase tracking-wider">Last saved</div>
              <div className="mt-0.5 font-mono">
                {new Date(lastUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 space-y-4">
          <Field label="Hero Title" value={form.heroTitle} onChange={(v) => setForm({ ...form, heroTitle: v })} />
          <Field label="Hero Subtitle" value={form.heroSubtitle} onChange={(v) => setForm({ ...form, heroSubtitle: v })} />
          <Field label="About Text" value={form.aboutText} onChange={(v) => setForm({ ...form, aboutText: v })} textarea />
          <Field label="Contact Email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />

          {/* Cloudinary URL paste — divider */}
          <div className="relative py-2">
            <div className="border-t border-dashed border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mint-300">
                <Link2 className="h-3 w-3" /> Cloudinary URL
              </span>
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-500">
            Upload your logo and background images to your own Cloudinary account, then paste the
            resulting{" "}
            <code className="rounded bg-white/5 px-1 py-0.5 text-ink-300">
              res.cloudinary.com/...
            </code>{" "}
            URL below. We do not host client uploads.
          </p>

          <UrlField
            label="Logo URL"
            value={form.logoUrl}
            onChange={(v) => setForm({ ...form, logoUrl: v })}
            placeholder="https://res.cloudinary.com/<cloud>/image/upload/.../logo.png"
            preview={isValidUrl(form.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover ring-1 ring-mint-300/30" />
            ) : null}
          />
          <UrlField
            label="Main Background URL"
            value={form.mainBgUrl}
            onChange={(v) => setForm({ ...form, mainBgUrl: v })}
            placeholder="https://res.cloudinary.com/<cloud>/image/upload/.../bg.jpg"
            preview={isValidUrl(form.mainBgUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.mainBgUrl} alt="bg" className="h-10 w-16 rounded-lg object-cover ring-1 ring-mint-300/30" />
            ) : null}
          />

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save changes"}
                </>
              )}
            </button>
            {saved && (
              <span className="text-xs text-emerald-300">
                ✓ Live on the public site now
              </span>
            )}
          </div>
        </div>
      </form>

      <div className="glass-card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Live preview</h3>
        <p className="mt-1 text-xs text-ink-400">
          Read-only snapshot of the current public site config.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <PreviewRow k="heroTitle" v={form.heroTitle.slice(0, 30) + (form.heroTitle.length > 30 ? "…" : "")} />
          <PreviewRow k="heroSubtitle" v={form.heroSubtitle.slice(0, 30) + (form.heroSubtitle.length > 30 ? "…" : "")} />
          <PreviewRow k="contactEmail" v={form.contactEmail} />
          <PreviewRow k="logoUrl" v={isValidUrl(form.logoUrl) ? "connected" : "empty"} />
          <PreviewRow k="mainBgUrl" v={isValidUrl(form.mainBgUrl) ? "connected" : "empty"} />
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">
            Logo preview
          </div>
          <div className="mt-2 flex items-center gap-3">
            {isValidUrl(form.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="logo" className="h-12 w-12 rounded-lg object-cover ring-1 ring-mint-300/30" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.02] ring-1 ring-white/5">
                <ImageIcon className="h-5 w-5 text-ink-500" />
              </div>
            )}
            <div className="text-xs text-ink-400">Paste any Cloudinary image URL</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* USER MANAGEMENT — full CRUD                                            */
/* • Superadmin (you) can never be deleted                                 */
/* • Superadmin can add / edit / delete any other admin                    */
/* • Persists to MongoDB via /api/team endpoints                           */
/* ─────────────────────────────────────────────────────────────────────── */

const TEAM_STORAGE_KEY = "theshield_team";
const SUPERADMIN_UID = "u_001"; // matches SEED_TEAM[0] — Akash Perera

// Always-seed superadmin row (used as fallback if API is unreachable)
const SEED_SUPERADMIN: TeamMember = {
  uid: SUPERADMIN_UID,
  name: "Akash Perera",
  email: "akashperera@shield.com",
  role: "superadmin",
  createdAt: "2026-06-01",
  jobField: "Management",
  mobile: "0741622795",
  username: "akashperera",
};

function readTeamCache(): TeamMember[] {
  if (typeof window === "undefined") return [SEED_SUPERADMIN];
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (!raw) return [SEED_SUPERADMIN];
    const parsed = JSON.parse(raw) as TeamMember[];
    if (!Array.isArray(parsed)) return [SEED_SUPERADMIN];
    // Always guarantee the superadmin exists in the cache
    if (!parsed.some((m) => m.uid === SUPERADMIN_UID)) {
      parsed.unshift(SEED_SUPERADMIN);
    }
    return parsed;
  } catch {
    return [SEED_SUPERADMIN];
  }
}

function writeTeamCache(team: TeamMember[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    window.dispatchEvent(new StorageEvent("storage", { key: TEAM_STORAGE_KEY }));
  } catch {}
}

async function apiGetTeam(): Promise<TeamMember[]> {
  const res = await fetch("/api/team", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as TeamMember[];
}

async function apiCreateTeamMember(
  m: TeamMember,
  password: string
): Promise<TeamMember> {
  const res = await fetch("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...m, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to add admin" }));
    throw new Error(err.error || "Failed to add admin");
  }
  return res.json();
}

async function apiUpdateTeamMember(
  uid: string,
  patch: Partial<TeamMember>,
  password?: string // optional — only sent if user typed a new password
): Promise<TeamMember> {
  const body: Record<string, unknown> = { ...patch };
  if (password) body.password = password;
  const res = await fetch(`/api/team/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to update admin" }));
    throw new Error(err.error || "Failed to update admin");
  }
  return res.json();
}

async function apiDeleteTeamMember(uid: string): Promise<void> {
  const res = await fetch(`/api/team/${uid}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to delete admin" }));
    throw new Error(err.error || "Failed to delete admin");
  }
}

function loadTeam(): TeamMember[] {
  const cached = readTeamCache();
  // Background refresh from MongoDB
  apiGetTeam()
    .then((fresh) => {
      if (fresh.length > 0) writeTeamCache(fresh);
    })
    .catch(() => {});
  return cached;
}

const JOB_FIELDS = [
  "Application Development",
  "Software Development",
  "Graphic Design",
  "Mobile App Development",
  "Website Development",
  "UI / UX Designing",
  "CRM Software Development",
  "Digital Marketing",
  "Artificial Intelligence",
  "Machine Learning",
  "SharePoint Integration",
  "NetSuite Integration",
  "Management",
];

interface AdminFormState {
  name: string;
  email: string;
  username: string;
  password: string;
  mobile: string;
  jobField: string;
}

const EMPTY_FORM: AdminFormState = {
  name: "",
  email: "",
  username: "",
  password: "",
  mobile: "",
  jobField: "",
};

function TeamPanel() {
  const { profile } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>(() => loadTeam());
  const [form, setForm] = useState<AdminFormState>(EMPTY_FORM);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────
  const isProtectedSuperadmin = (m: TeamMember) =>
    m.role === "superadmin" && m.uid === SUPERADMIN_UID;

  const update = <K extends keyof AdminFormState>(k: K, v: AdminFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const persist = (next: TeamMember[]) => {
    setTeam(next);
    writeTeamCache(next);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    if (!form.username.trim()) return "Username is required.";
    if (!form.password.trim() && !editingUid) return "Password is required.";
    if (form.password && form.password.length < 6) return "Password must be at least 6 characters.";
    if (!form.jobField) return "Job field is required.";
    // Unique email/username check
    const dupe = team.find(
      (m) =>
        m.uid !== editingUid &&
        (m.email.toLowerCase() === form.email.trim().toLowerCase() ||
          (m.username || "").toLowerCase() === form.username.trim().toLowerCase())
    );
    if (dupe) return "Another admin already uses this email or username.";
    return null;
  };

  // ── Create / Update ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const v = validate();
    if (v) {
      setMsg({ type: "err", text: v });
      return;
    }

    setBusy(true);
    try {
      if (editingUid) {
        // ── UPDATE ──
        const patch: Partial<TeamMember> = {
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          mobile: form.mobile.trim(),
          jobField: form.jobField,
        };
        // Only send password if the user typed a new one
        const newPassword = form.password.trim() || undefined;
        await apiUpdateTeamMember(editingUid, patch, newPassword);
        const fresh = await apiGetTeam();
        persist(fresh);
        setMsg({
          type: "ok",
          text: newPassword
            ? `Updated ${form.name} — password changed.`
            : `Updated ${form.name}.`,
        });
        setEditingUid(null);
        setForm(EMPTY_FORM);
      } else {
        // ── CREATE ──
        const newMember: TeamMember = {
          uid: "u_" + Math.random().toString(36).slice(2, 8),
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          mobile: form.mobile.trim(),
          jobField: form.jobField,
          role: "admin",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        await apiCreateTeamMember(newMember, form.password);
        const fresh = await apiGetTeam();
        persist(fresh);
        setMsg({ type: "ok", text: `Admin added: ${form.email}` });
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to save admin.";
      setMsg({ type: "err", text: m });
    } finally {
      setBusy(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────
  const startEdit = (m: TeamMember) => {
    setEditingUid(m.uid);
    setForm({
      name: m.name,
      email: m.email,
      username: m.username || "",
      password: "", // blank = keep current
      mobile: m.mobile || "",
      jobField: m.jobField || "",
    });
    setMsg(null);
    setShowPass(false);
    // Scroll to form
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingUid(null);
    setForm(EMPTY_FORM);
    setMsg(null);
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (m: TeamMember) => {
    if (isProtectedSuperadmin(m)) {
      setMsg({ type: "err", text: "The superadmin account cannot be deleted." });
      return;
    }
    if (confirmDeleteUid !== m.uid) {
      setConfirmDeleteUid(m.uid);
      return;
    }
    setBusy(true);
    try {
      await apiDeleteTeamMember(m.uid);
      const fresh = await apiGetTeam();
      persist(fresh);
      setConfirmDeleteUid(null);
      setMsg({ type: "ok", text: `Removed ${m.name}.` });
      if (editingUid === m.uid) cancelEdit();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete admin.";
      setMsg({ type: "err", text: errMsg });
      setConfirmDeleteUid(null);
    } finally {
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  const editingTarget = editingUid ? team.find((m) => m.uid === editingUid) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
      {/* ── LEFT: FORM ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {editingUid ? "Edit admin" : "Add new admin"}
          </h2>
          {editingUid && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-400">
          {editingUid && editingTarget && isProtectedSuperadmin(editingTarget)
            ? "Editing your own superadmin profile. Role cannot be changed."
            : "Creates a new admin login. Superadmin (you) has full control — admins can be edited or removed at any time."}
        </p>

        <div className="mt-5 space-y-4">
          {/* Name */}
          <AdminField label="Full name" required>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="input-field pl-10"
                placeholder="Jane Doe"
              />
            </div>
          </AdminField>

          {/* Email + Username */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="jane@theshield.agency"
                />
              </div>
            </AdminField>
            <AdminField label="Username" required>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="jane_doe"
                />
              </div>
            </AdminField>
          </div>

          {/* Password + Mobile */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label={editingUid ? "New password (leave blank to keep)" : "Password"} required={!editingUid}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required={!editingUid}
                  minLength={form.password ? 6 : undefined}
                  className="input-field pl-10 pr-10"
                  placeholder={editingUid ? "•••••• (unchanged)" : "Min. 6 characters"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </AdminField>
            <AdminField label="Mobile (optional)">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => update("mobile", e.target.value)}
                  className="input-field pl-10"
                  placeholder="0741234567"
                />
              </div>
            </AdminField>
          </div>

          {/* Job field */}
          <AdminField label="Job field" required>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <select
                value={form.jobField}
                onChange={(e) => update("jobField", e.target.value)}
                required
                className="input-field pl-10"
              >
                <option value="">Select a field…</option>
                {JOB_FIELDS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </AdminField>

          {msg && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                msg.type === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : (
              <>
                {editingUid ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingUid ? "Save changes" : "Add admin"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── RIGHT: ROSTER ──────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">User management</h3>
            <p className="mt-1 text-xs text-ink-400">
              {team.length} {team.length === 1 ? "user" : "users"} · superadmin is protected
            </p>
          </div>
          {profile?.role === "superadmin" && (
            <span className="badge badge-progress">
              <Shield className="mr-1 h-3 w-3" /> Full CRUD
            </span>
          )}
        </div>

        <div className="mt-4 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
          {team.map((m) => {
            const protectedAdmin = isProtectedSuperadmin(m);
            const isConfirming = confirmDeleteUid === m.uid;
            return (
              <div
                key={m.uid}
                className={`rounded-xl border p-4 transition-colors ${
                  protectedAdmin
                    ? "border-violet-500/30 bg-violet-600/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <GradientAvatar
                    initial={m.name.charAt(0)}
                    size={40}
                    variant={m.role === "superadmin" ? "violet" : "mint"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{m.name}</span>
                      <span
                        className={
                          m.role === "superadmin" ? "badge badge-progress" : "badge badge-pending"
                        }
                      >
                        {m.role}
                      </span>
                      {protectedAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/10 px-2 py-0.5 text-[10px] text-violet-300">
                          <Shield className="h-3 w-3" /> you
                        </span>
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {m.email}
                      </span>
                      {m.username && (
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <AtSign className="h-3 w-3 shrink-0" /> {m.username}
                        </span>
                      )}
                      {m.jobField && (
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <Briefcase className="h-3 w-3 shrink-0" /> {m.jobField}
                        </span>
                      )}
                      {m.mobile && (
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <Phone className="h-3 w-3 shrink-0" /> {m.mobile}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="rounded-md p-1.5 text-ink-400 hover:bg-mint-300/10 hover:text-mint-300"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {protectedAdmin ? (
                      <button
                        type="button"
                        disabled
                        title="Superadmin cannot be deleted"
                        className="cursor-not-allowed rounded-md p-1.5 text-ink-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        className={`rounded-md p-1.5 transition-colors ${
                          isConfirming
                            ? "bg-rose-500/20 text-rose-300"
                            : "text-ink-400 hover:bg-rose-500/10 hover:text-rose-300"
                        }`}
                        title={isConfirming ? "Click again to confirm" : "Remove"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {isConfirming && (
                  <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    Remove {m.name}? This cannot be undone.{" "}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUid(null)}
                      className="ml-1 underline hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Tiny labelled field wrapper to keep the form tidy */
function AdminField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
        {label} {required && <span className="text-mint-300">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* SHOWCASE PANEL — manage the public "Our Projects" cards                */
/* • Add / edit / delete project cards                                     */
/* • Paste Cloudinary URL for the card image                               */
/* • Paste project URL — clicking the card opens it                        */
/* • Toggle featured, reorder, tag                                         */
/* ─────────────────────────────────────────────────────────────────────── */

interface ShowcaseFormState {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  tagsText: string; // comma-separated in the form, stored as array
  featured: boolean;
}

const EMPTY_SHOWCASE_FORM: ShowcaseFormState = {
  title: "",
  category: "",
  description: "",
  imageUrl: "",
  projectUrl: "",
  tagsText: "",
  featured: false,
};

function ShowcasePanel() {
  const [projects, setProjects] = useState<ShowcaseProject[]>(() => loadShowcase());
  const [form, setForm] = useState<ShowcaseFormState>(EMPTY_SHOWCASE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const update = <K extends keyof ShowcaseFormState>(k: K, v: ShowcaseFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const persist = async (next: ShowcaseProject[]) => {
    setProjects(next);
    try {
      await saveShowcase(next);
    } catch (e) {
      setMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to save to database.",
      });
    }
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.category) return "Category is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl))
      return "Image URL must start with http(s)://";
    if (form.projectUrl && !/^https?:\/\/.+/.test(form.projectUrl))
      return "Project URL must start with http(s)://";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const v = validate();
    if (v) {
      setMsg({ type: "err", text: v });
      return;
    }
    setBusy(true);
    try {
      const tags = form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingId) {
        const next = projects.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title: form.title.trim(),
                category: form.category,
                description: form.description.trim(),
                imageUrl: form.imageUrl.trim(),
                projectUrl: form.projectUrl.trim(),
                tags,
                featured: form.featured,
              }
            : p
        );
        await persist(next);
        setMsg({ type: "ok", text: `Updated "${form.title}".` });
      } else {
        const newProject: ShowcaseProject = {
          id: newShowcaseId(),
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          projectUrl: form.projectUrl.trim(),
          tags,
          featured: form.featured,
          order: projects.length + 1,
        };
        await persist([newProject, ...projects]);
        setMsg({ type: "ok", text: `Added "${form.title}".` });
      }
      setForm(EMPTY_SHOWCASE_FORM);
      setEditingId(null);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to save project.";
      setMsg({ type: "err", text: m });
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p: ShowcaseProject) => {
    setEditingId(p.id);
    setForm({
      title: p.title ?? "",
      category: p.category ?? "Other",
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      projectUrl: p.projectUrl ?? "",
      tagsText: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      featured: Boolean(p.featured),
    });
    setMsg(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_SHOWCASE_FORM);
    setMsg(null);
  };

  const handleDelete = (p: ShowcaseProject) => {
    if (confirmDeleteId !== p.id) {
      setConfirmDeleteId(p.id);
      return;
    }
    void persist(projects.filter((x) => x.id !== p.id));
    setConfirmDeleteId(null);
    setMsg({ type: "ok", text: `Removed "${p.title}".` });
    if (editingId === p.id) cancelEdit();
  };

  const toggleFeatured = (p: ShowcaseProject) => {
    void persist(
      projects.map((x) => (x.id === p.id ? { ...x, featured: !x.featured } : x))
    );
  };

  const move = (p: ShowcaseProject, dir: -1 | 1) => {
    const sorted = [...projects].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((x) => x.id === p.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const swap = sorted[target];
    const tmpOrder = sorted[idx].order || 0;
    sorted[idx] = { ...sorted[idx], order: swap.order || 0 };
    sorted[target] = { ...swap, order: tmpOrder };
    void persist(sorted);
  };

  const sorted = [...projects].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* ── LEFT: FORM ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {editingId ? "Edit project" : "Add new project"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-400">
          Add a project card to the homepage. Paste image + project URLs — clicking the card opens the project in a new tab.
        </p>

        <div className="mt-5 space-y-4">
          <AdminField label="Title" required>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="input-field"
              placeholder="Layla Cosmetics — D2C Storefront"
            />
          </AdminField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Category" required>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  required
                  className="input-field pl-10"
                >
                  <option value="">Select…</option>
                  {SHOWCASE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </AdminField>
            <AdminField label="Tags (comma-separated)">
              <input
                value={form.tagsText}
                onChange={(e) => update("tagsText", e.target.value)}
                className="input-field"
                placeholder="Next.js, Shopify, AR"
              />
            </AdminField>
          </div>

          <AdminField label="Description" required>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
              className="input-field resize-none"
              placeholder="Short summary of the project — what was built, stack, outcome."
            />
          </AdminField>

          {/* Image URL with live preview */}
          <AdminField label="Image URL" required={false}>
            <div className="space-y-2">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  className="input-field pl-10 font-mono text-xs"
                  placeholder="https://res.cloudinary.com/…/your-image.png"
                />
              </div>
              {form.imageUrl && /^https?:\/\/.+/.test(form.imageUrl) ? (
                <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="h-14 w-24 rounded-md object-cover ring-1 ring-white/10"
                  />
                  <div className="text-xs text-ink-400">
                    <div className="flex items-center gap-1 text-emerald-300">
                      <ImageIcon className="h-3 w-3" /> Image linked
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-ink-500">
                      {form.imageUrl}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-ink-500">
                  Paste any image URL — recommended 16:10 ratio.
                </p>
              )}
            </div>
          </AdminField>

          {/* Project URL */}
          <AdminField label="Project URL (clicking the card opens this)" required={false}>
            <div className="relative">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                value={form.projectUrl}
                onChange={(e) => update("projectUrl", e.target.value)}
                className="input-field pl-10 font-mono text-xs"
                placeholder="https://your-live-project.com"
              />
            </div>
            {form.projectUrl && /^https?:\/\/.+/.test(form.projectUrl) && (
              <a
                href={form.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-mint-300 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Test link
              </a>
            )}
          </AdminField>

          {/* Featured toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-navy-900 text-mint-300 focus:ring-mint-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Star className="h-3.5 w-3.5 text-amber-300" /> Featured project
              </div>
              <div className="text-[10px] text-ink-500">
                Featured cards appear first on the homepage.
              </div>
            </div>
          </label>

          {msg && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                msg.type === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : (
              <>
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Save changes" : "Add project"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── RIGHT: ROSTER ──────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Project cards</h3>
            <p className="mt-1 text-xs text-ink-400">
              {projects.length} {projects.length === 1 ? "project" : "projects"} · drag is not supported — use ↑/↓ to reorder
            </p>
          </div>
          <span className="badge badge-progress">
            <FolderKanban className="mr-1 h-3 w-3" /> Live
          </span>
        </div>

        <div className="mt-4 max-h-[40rem] space-y-3 overflow-y-auto pr-1">
          {sorted.map((p) => {
            const isConfirming = confirmDeleteId === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-3 transition-colors ${
                  p.featured
                    ? "border-amber-500/20 bg-amber-500/[0.03]"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-navy-800 ring-1 ring-white/10">
                    {/^https?:\/\/.+/.test(p.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-ink-600" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{p.title}</span>
                      {p.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          <Star className="h-3 w-3" /> Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-ink-500">
                      <span className="rounded bg-white/[0.03] px-1.5 py-0.5">{p.category}</span>
                      {p.projectUrl && (
                        <a
                          href={p.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-mint-300 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> live link
                        </a>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-400">{p.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      className={`rounded-md p-1.5 transition-colors ${
                        p.featured
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-ink-500 hover:bg-amber-500/10 hover:text-amber-300"
                      }`}
                      title={p.featured ? "Unfeature" : "Mark as featured"}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(p, -1)}
                        className="rounded-md p-1 text-ink-500 hover:bg-white/5 hover:text-white"
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(p, 1)}
                        className="rounded-md p-1 text-ink-500 hover:bg-white/5 hover:text-white"
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="rounded-md p-1.5 text-ink-400 hover:bg-mint-300/10 hover:text-mint-300"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className={`rounded-md p-1.5 transition-colors ${
                        isConfirming
                          ? "bg-rose-500/20 text-rose-300"
                          : "text-ink-400 hover:bg-rose-500/10 hover:text-rose-300"
                      }`}
                      title={isConfirming ? "Click again to confirm" : "Remove"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isConfirming && (
                  <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    Remove "{p.title}"? This cannot be undone.{" "}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="ml-1 underline hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-ink-400">
              No project cards yet. Add your first one using the form on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function AnalyticsPanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const d = await fetchAnalytics();
        if (cancelled) return;
        setData(d);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    pull();
    const interval = setInterval(pull, 60000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 text-sm text-ink-400">
        <span className="mr-2 inline-block h-4 w-4 animate-spin-fast rounded-full border-2 border-white/20 border-t-mint-300 align-middle" />
        Loading real-time analytics…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="glass-card p-6 text-sm text-rose-300">
        {error || "Analytics unavailable."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
              <BarChart3 className="h-3.5 w-3.5 text-mint-300" /> Traffic (30d)
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              {data.pageviews.last30d.toLocaleString()}
              <span className="ml-2 text-xs font-normal text-emerald-300">
                {data.pageviews.growthPct >= 0 ? "+" : ""}
                {data.pageviews.growthPct}%
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-ink-500">
              {data.pageviews.uniqueVisitors30d} unique visitors · {data.pageviews.total.toLocaleString()} all-time
            </div>
          </div>
        </div>
        <div className="mt-4">
          <MiniAreaChart
            data={data.pageviews.series30d}
            width={400}
            height={120}
            stroke="#64ffda"
            fillFrom="rgba(100, 255, 218, 0.30)"
            fillTo="rgba(100, 255, 218, 0)"
            strokeWidth={2}
          />
        </div>
      </div>
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Activity className="h-3.5 w-3.5 text-violet-300" /> Engagement
        </div>
        <div className="mt-4 flex items-center justify-around">
          <CircularGauge
            value={data.engagement.satisfactionPct}
            size={110}
            stroke={10}
            sublabel="satisfaction"
            gradientFrom="#64ffda"
            gradientTo="#26d0a8"
          />
          <CircularGauge
            value={data.engagement.completionPct}
            size={110}
            stroke={10}
            sublabel="completed"
            gradientFrom="#667eea"
            gradientTo="#764ba2"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-ink-500">
          <div>
            avg rating · <span className="font-bold text-amber-300">{data.engagement.avgRating} / 5</span>
          </div>
          <div className="text-right">
            showcase clicks (30d) · <span className="font-bold text-mint-300">{data.showcase.clicks30d}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function StoragePanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const d = await fetchAnalytics();
        if (cancelled) return;
        setData(d);
      } catch {
        // swallow
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    pull();
    const interval = setInterval(pull, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="glass-card p-6 text-sm text-ink-400">
        <span className="mr-2 inline-block h-4 w-4 animate-spin-fast rounded-full border-2 border-white/20 border-t-mint-300 align-middle" />
        Loading storage stats…
      </div>
    );
  }

  const s = data.storage;
  const total = s.totalDocuments;
  const maxBar = Math.max(1, ...Object.values(s).filter((v) => typeof v === "number") as number[]);
  const rows: { label: string; count: number; color: string }[] = [
    { label: "Submissions", count: s.submissions, color: "#64ffda" },
    { label: "Feedback", count: s.feedback, color: "#667eea" },
    { label: "Showcase", count: s.showcase, color: "#9d8df1" },
    { label: "Team", count: s.team, color: "#fbbf24" },
    { label: "Sessions", count: s.sessions, color: "#f43f5e" },
    { label: "Activity Log", count: s.activityLog, color: "#26d0a8" },
    { label: "Analytics Events", count: s.analyticsEvents, color: "#764ba2" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass-card p-4 sm:p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
              <HardDrive className="h-3.5 w-3.5 text-mint-300" /> Document counts (by collection)
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              {total.toLocaleString()}
              <span className="ml-2 text-xs font-normal text-ink-400">total documents</span>
            </div>
            <div className="mt-0.5 text-[10px] text-ink-500">
              MongoDB Atlas · 7 collections · real counts (not estimates)
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-32 text-xs text-ink-300">{r.label}</div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(r.count / maxBar) * 100}%`,
                    backgroundColor: r.color,
                  }}
                />
              </div>
              <div className="w-12 text-right text-xs font-mono text-white">{r.count}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Activity className="h-3.5 w-3.5 text-mint-300" /> Active sessions
        </div>
        <div className="mt-6 flex justify-center">
          <CircularGauge
            value={Math.min(100, s.sessions * 10)}
            size={140}
            stroke={12}
            sublabel={`${s.sessions} active`}
          />
        </div>
        <div className="mt-4 text-center text-[10px] text-ink-500">
          Each login creates a session row. Sessions expire after 14 days.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function ActivityPanel() {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch(`/api/activity-log?limit=${limit}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load activity log");
        const data = (await res.json()) as ActivityEntry[];
        if (cancelled) return;
        setEntries(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    pull();
    const interval = setInterval(pull, 15000); // refresh every 15s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="glass-card p-6 text-sm text-ink-400">
        <span className="mr-2 inline-block h-4 w-4 animate-spin-fast rounded-full border-2 border-white/20 border-t-mint-300 align-middle" />
        Loading activity log…
      </div>
    );
  }
  if (error) {
    return <div className="glass-card p-6 text-sm text-rose-300">{error}</div>;
  }
  if (!entries || entries.length === 0) {
    return (
      <div className="glass-card p-6 text-sm text-ink-400">
        No activity yet. As admins make changes (add projects, approve feedback, edit team members), entries will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Audit trail</h2>
          <p className="mt-1 text-xs text-ink-400">
            Every admin mutation is recorded with who/when/what. Newest first.
          </p>
        </div>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setLoading(true);
          }}
          className="input-field w-auto text-xs"
        >
          <option value={25}>Last 25</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/5">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start gap-3 p-3 text-xs">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-mint-300">
                {e.actorName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{e.actorName}</span>
                  <span className="text-ink-500">·</span>
                  <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-mint-300">
                    {e.action}
                  </code>
                  {e.target && (
                    <span className="text-ink-500">→ {e.target}</span>
                  )}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-500">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.actorEmail && ` · ${e.actorEmail}`}
                </div>
                {e.meta && Object.keys(e.meta).length > 0 && (
                  <div className="mt-1 text-[10px] text-ink-400">
                    {Object.entries(e.meta).slice(0, 4).map(([k, v]) => (
                      <span key={k} className="mr-2">
                        <span className="text-ink-500">{k}:</span>{" "}
                        <span className="text-ink-300">{String(v).slice(0, 60)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function SecurityPanel() {
  const { profile, logout, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMsg({ type: "err", text: "Enter an email address." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await resetPassword(email.trim());
      setMsg({ type: "ok", text: r.message });
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Lock className="h-3.5 w-3.5 text-mint-300" /> Session security
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white">
          You are signed in as <span className="text-mint-300">{profile?.email}</span>
        </h2>
        <p className="mt-1 text-xs text-ink-400">
          Your session is stored as an HttpOnly cookie + a MongoDB Session row.
          Sessions auto-expire after 14 days. Logging out clears the cookie +
          deletes the Session row from the database.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => logout(false)}
            className="btn-ghost text-sm"
          >
            <X className="h-4 w-4" /> Log out this device
          </button>
          <button
            onClick={() => {
              if (window.confirm("This will log you out on EVERY device you're signed in on. Continue?")) {
                void logout(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
          >
            <Shield className="h-4 w-4" /> Log out everywhere
          </button>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Mail className="h-3.5 w-3.5 text-violet-300" /> Password reset
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Request a password reset for any admin account (including yourself).
          A single-use token is generated with a 1-hour expiry. In production
          with email configured, this would email the link. Without email,
          the token is logged server-side.
        </p>
        <form onSubmit={handleReset} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="input-field flex-1"
          />
          <button type="submit" disabled={busy} className="btn-primary text-sm">
            {busy ? "Sending…" : "Request reset"}
          </button>
        </form>
        {msg && (
          <div
            className={`mt-3 rounded-lg border p-3 text-xs ${
              msg.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Download className="h-3.5 w-3.5 text-mint-300" /> Backup &amp; export
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Download any collection as JSON or CSV. Backups include all documents
          but never include password hashes.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(["submissions", "showcase", "feedback", "team"] as const).map((c) => (
            <div key={c} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="text-xs font-semibold capitalize text-white">{c}</div>
              <div className="mt-2 flex gap-1">
                <a
                  href={`/api/export?collection=${c}&format=json`}
                  className="flex-1 rounded bg-mint-300/10 px-2 py-1 text-center text-[10px] font-medium text-mint-300 hover:bg-mint-300/20"
                >
                  JSON
                </a>
                <a
                  href={`/api/export?collection=${c}&format=csv`}
                  className="flex-1 rounded bg-violet-600/10 px-2 py-1 text-center text-[10px] font-medium text-violet-300 hover:bg-violet-600/20"
                >
                  CSV
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <a
            href="/api/export?collection=all&format=json"
            className="inline-flex items-center gap-2 rounded-lg border border-mint-300/30 bg-mint-300/10 px-3 py-2 text-xs font-medium text-mint-300 hover:bg-mint-300/20"
          >
            <Download className="h-3.5 w-3.5" /> Download full backup (JSON)
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function Field({
  label,
  value = "",
  onChange,
  textarea,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field resize-none"
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
      )}
    </div>
  );
}

function UrlField({
  label,
  value = "",
  onChange,
  placeholder,
  preview,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  preview?: React.ReactNode;
}) {
  const isValid = /^https?:\/\/.+/.test(value || "");
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input-field pl-10 font-mono text-xs"
          />
        </div>
        {preview}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
        {value && !isValid ? (
          <span className="text-rose-300">Please paste a full https:// URL</span>
        ) : isValid ? (
          <span className="text-emerald-300">URL valid — image will load on the public site</span>
        ) : (
          <span className="text-ink-500">Tip: paste your Cloudinary delivery URL here</span>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="font-mono text-xs text-ink-400">{k}</span>
      <span className="truncate ml-3 text-right text-ink-200">{v}</span>
    </div>
  );
}
