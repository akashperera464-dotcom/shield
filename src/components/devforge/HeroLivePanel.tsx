"use client";

// HeroLivePanel — replaces the old static "dashboard preview" card on the
// homepage hero with a REAL-TIME data panel wired to the actual system.
//
// What it shows (all live, all from the same localStorage the admin panel
// reads/writes):
//   • Total submissions
//   • Per-status counts (Pending / In Progress / Under Review / Completed)
//   • Today's new submissions
//   • % completion gauge (completed / total)
//   • 7-day submission histogram (mini bar chart, computed from createdAt)
//   • Showcase project count + featured count
//   • "Updated Xs ago" indicator that re-ticks every 5s
//   • "Open dashboard" button (visible to admins)
//
// Live updates:
//   • Listens to window `storage` events so when a client submits a project
//     in another tab OR an admin updates a status in another tab, this panel
//     re-renders within ~1 second.
//   • Also re-pulls every 5s as a safety net (in case the storage event
//     doesn't fire — e.g. same-tab updates).
//
// Once Firebase is wired, only the import source changes — the UI stays.

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  Search,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loadSubmissions, type Submission } from "@/lib/submissions";
import { loadShowcase } from "@/lib/showcase";
import { CircularGauge, MiniBarChart } from "./Charts";
import { useTilt } from "@/hooks/use-animations";

interface SystemStats {
  total: number;
  pending: number;
  inProgress: number;
  underReview: number;
  completed: number;
  todayCount: number;
  weekCount: number;
  last7Days: { label: string; value: number; color: "mint" | "violet" | "purple" }[];
  showcaseTotal: number;
  showcaseFeatured: number;
  completionRate: number; // 0-100
  latest?: Submission;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function computeStats(
  submissions: Submission[],
  showcaseTotal: number,
  showcaseFeatured: number
): SystemStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build last-7-days histogram (oldest → newest)
  const days: { date: Date; label: string; value: number; color: "mint" | "violet" | "purple" }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      value: 0,
      color: i === 0 ? "violet" : i === 6 ? "purple" : "mint",
    });
  }
  for (const s of submissions) {
    const d = new Date(s.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    for (const day of days) {
      const next = new Date(day.date);
      next.setDate(day.date.getDate() + 1);
      if (d >= day.date && d < next) {
        day.value++;
        break;
      }
    }
  }

  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "Pending").length;
  const inProgress = submissions.filter((s) => s.status === "In Progress").length;
  const underReview = submissions.filter((s) => s.status === "Under Review").length;
  const completed = submissions.filter((s) => s.status === "Completed").length;
  const todayCount = submissions.filter((s) => isSameDay(new Date(s.createdAt), now)).length;
  const weekCount = submissions.filter((s) => new Date(s.createdAt) >= weekAgo).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Latest submission (newest createdAt)
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    total,
    pending,
    inProgress,
    underReview,
    completed,
    todayCount,
    weekCount,
    last7Days: days,
    showcaseTotal,
    showcaseFeatured,
    completionRate,
    latest: sorted[0],
  };
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function HeroLivePanel() {
  const { isAuthenticated, isAdmin, setView } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [tick, setTick] = useState(0); // forces "Xs ago" re-render
  const mountedRef = useRef(true);
  const tilt = useTilt<HTMLDivElement>(4); // gentle 4° tilt on cursor move

  useEffect(() => {
    mountedRef.current = true;
    const pull = () => {
      try {
        const subs = loadSubmissions();
        const showcase = loadShowcase();
        const featured = Array.isArray(showcase)
          ? showcase.filter((p) => p && p.featured).length
          : 0;
        setStats(computeStats(subs, showcase.length, featured));
        setLastUpdated(Date.now());
      } catch (err) {
        // Defensive: never let a single bad pull crash the hero panel
        // or take down the homepage render. The previous stats remain.
        console.error("[HeroLivePanel] pull failed:", err);
      }
    };
    pull();

    // Live: re-pull whenever localStorage changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "theshield_submissions" ||
        e.key === "theshield_submissions_meta" ||
        e.key === "theshield_showcase" ||
        e.key === null
      ) {
        pull();
      }
    };
    window.addEventListener("storage", onStorage);

    // Safety-net poll every 5s (also refreshes "Xs ago")
    const interval = setInterval(() => {
      pull();
      if (mountedRef.current) setTick((t) => t + 1);
    }, 5000);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  // "Updated Xs ago" computation
  const updatedLabel = useMemo(() => {
    const s = Math.floor((Date.now() - lastUpdated) / 1000);
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    return `${m}m ago`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdated, tick]);

  if (!stats) {
    return (
      <div className="relative animate-scale-in stagger-3">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-mint-300/20 via-violet-600/15 to-violet-500/10 blur-2xl animate-pulse-glow" />
        <div className="relative glass-card overflow-hidden p-1">
          <div className="rounded-t-[15px] border-b border-white/5 bg-navy-900/60 px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/40" />
                <span className="h-3 w-3 rounded-full bg-amber-400/40" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/40" />
              </div>
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
          <div className="bg-navy-900/40 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-28" />
              </div>
              <div className="skeleton h-6 w-14 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.05] px-3 py-2">
                  <div className="skeleton h-2.5 w-12" />
                  <div className="skeleton mt-2 h-5 w-8" />
                  <div className="skeleton mt-1.5 h-2 w-10" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.05] p-4">
              <div className="skeleton h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.05] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="skeleton h-3 w-16" />
                    <div className="skeleton h-4 w-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const STATUS_ROWS = [
    { label: "Pending",      icon: Clock,        count: stats.pending,      color: "text-amber-300",   bg: "bg-amber-500/15" },
    { label: "In Progress",  icon: Loader2,      count: stats.inProgress,   color: "text-mint-300",    bg: "bg-mint-300/15", spin: true },
    { label: "Under Review", icon: Search,       count: stats.underReview,  color: "text-violet-300",  bg: "bg-violet-500/15" },
    { label: "Completed",    icon: CheckCircle2, count: stats.completed,    color: "text-emerald-300", bg: "bg-emerald-500/15" },
  ];

  return (
    <div className="relative animate-scale-in stagger-3" ref={tilt.ref} style={tilt.style}>
      {/* Glow */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-mint-300/20 via-violet-600/15 to-violet-500/10 blur-2xl animate-pulse-glow" />

      <div className="relative glass-card overflow-hidden p-1">
        {/* Window chrome */}
        <div className="rounded-t-[15px] border-b border-white/5 bg-navy-900/60 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="font-mono text-[10px] text-ink-500">theshield.app · live</span>
          </div>
        </div>

        {/* Card body */}
        <div className="bg-navy-900/40 p-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">System pulse</div>
              <div className="text-sm font-semibold text-white">Real-time overview</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              LIVE
            </span>
          </div>

          {/* Top stat tiles */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatTile
              label="Submissions"
              value={stats.total}
              sub={`+${stats.todayCount} today`}
              color="text-mint-300"
            />
            <StatTile
              label="This week"
              value={stats.weekCount}
              sub="last 7 days"
              color="text-violet-300"
            />
            <StatTile
              label="Showcase"
              value={stats.showcaseTotal}
              sub={`${stats.showcaseFeatured} featured`}
              color="text-amber-300"
            />
          </div>

          {/* Gauge + 7-day histogram */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.05] p-3 sm:gap-4 sm:p-4">
            <CircularGauge
              value={stats.completionRate}
              size={80}
              stroke={9}
              sublabel="completed"
              gradientFrom="#64ffda"
              gradientTo="#26d0a8"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">
                  Submissions · last 7 days
                </div>
                <TrendingUp className="h-3 w-3 text-mint-300" />
              </div>
              <div className="mt-1 text-xl font-bold text-white">
                {stats.completionRate}
                <span className="text-xs font-normal text-ink-400">% completion rate</span>
              </div>
              <div className="mt-1">
                <MiniBarChart
                  data={stats.last7Days}
                  width={180}
                  height={44}
                  barWidth={18}
                  gap={6}
                />
              </div>
            </div>
          </div>

          {/* Status workflow rows */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {STATUS_ROWS.map((s, i) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.05] px-3 py-2 animate-fade-up"
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${s.bg}`}>
                    <s.icon
                      className={`h-3 w-3 ${s.spin ? "animate-spin-fast" : ""} ${s.color}`}
                    />
                  </span>
                  <span className="text-xs text-ink-200">{s.label}</span>
                </div>
                <span className={`text-sm font-bold ${s.color}`}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* Latest submission teaser */}
          {stats.latest ? (
            <div className="mt-3 rounded-lg border border-mint-300/15 bg-mint-300/[0.03] px-3 py-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-mint-300" /> Latest submission
                </span>
                <span>{timeAgo(stats.latest.createdAt)}</span>
              </div>
              <div className="mt-1 truncate text-xs text-white">
                <span className="font-semibold">{stats.latest.name}</span>
                <span className="text-ink-400"> · {stats.latest.service}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.05] px-3 py-2 text-center text-[11px] text-ink-500">
              <Inbox className="mx-auto mb-1 h-3 w-3" />
              No submissions yet — be the first!
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3 text-mint-300" />
              Updated {updatedLabel}
            </span>
            {isAuthenticated && isAdmin ? (
              <button
                onClick={() => setView("dashboard")}
                className="inline-flex items-center gap-1 text-mint-300 hover:text-mint-200"
              >
                Open dashboard <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-300" /> Synced with admin panel
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.05] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-ink-500">{sub}</div>
    </div>
  );
}
