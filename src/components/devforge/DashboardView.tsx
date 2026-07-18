"use client";

import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Clock,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  X,
  StickyNote,
  Send,
  Eye,
  Paperclip,
  Calendar,
  User,
  Mail,
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  Bell,
  Home as HomeIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DEMO_PROJECTS,
  STATUS_CLASS,
  STATUSES,
  type Project,
  type ProjectNote,
} from "@/data/demo";
import {
  CircularGauge,
  MiniAreaChart,
  MiniBarChart,
  Sparkline,
  GradientAvatar,
} from "./Charts";
import { loadSubmissions, getMeta } from "@/lib/submissions";
import NotificationsPanel from "./NotificationsPanel";

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png";

const SIDEBAR_NAV = [
  { id: "home",          label: "Back to site",    icon: HomeIcon },
  { id: "dashboard",     label: "Overview",        icon: LayoutDashboard },
  { id: "projects",      label: "Projects",        icon: Inbox },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "analytics",     label: "Analytics",       icon: Activity },
  { id: "settings",      label: "Settings",        icon: Settings },
] as const;

const REVENUE_DATA  = [42, 38, 55, 48, 65, 58, 72, 68, 85, 78, 92, 96];
const ACTIVITY_DATA = [12, 18, 14, 22, 19, 28, 24, 32, 30, 38, 35, 45];

const WEEKLY_BARS = [
  { label: "Mon", value: 28, color: "mint"   as const },
  { label: "Tue", value: 42, color: "violet" as const },
  { label: "Wed", value: 35, color: "mint"   as const },
  { label: "Thu", value: 58, color: "purple" as const },
  { label: "Fri", value: 48, color: "violet" as const },
  { label: "Sat", value: 22, color: "mint"   as const },
  { label: "Sun", value: 18, color: "amber"  as const },
];

export default function DashboardView() {
  const { profile, isSuperadmin, setView } = useAuth();
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [activeNav, setActiveNav] = useState<string>("dashboard");

  const metrics = useMemo(
    () => ({
      total: projects.length,
      pending: projects.filter((p) => p.status === "Pending").length,
      progress: projects.filter((p) => p.status === "In Progress").length,
      completed: projects.filter((p) => p.status === "Completed").length,
      review: projects.filter((p) => p.status === "Under Review").length,
    }),
    [projects]
  );

  const completionRate = Math.round((metrics.completed / metrics.total) * 100);
  const activeRate = Math.round(((metrics.progress + metrics.review) / metrics.total) * 100);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus = filter === "All" || p.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.clientName.toLowerCase().includes(q) ||
        p.clientEmail.toLowerCase().includes(q) ||
        p.projectTitle.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [projects, filter, query]);

  const handleNav = (id: string) => {
    if (id === "home") {
      setView("home");
      return;
    }
    if (id === "settings" && isSuperadmin) {
      setView("superadmin");
      return;
    }
    setActiveNav(id);
  };

  const METRICS = [
    {
      label: "Total Projects",
      icon: Inbox as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
      value: metrics.total,
      delta: "+12%",
      spark: [3, 4, 5, 5, 6, 7, 8, 9],
      color: "#64ffda",
    },
    {
      label: "In Progress",
      icon: Loader2 as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
      value: metrics.progress,
      delta: "+3",
      spark: [1, 2, 2, 3, 2, 3, 3, 2],
      color: "#667eea",
    },
    {
      label: "Pending Review",
      icon: Clock as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
      value: metrics.pending + metrics.review,
      delta: "+1",
      spark: [2, 3, 2, 4, 3, 5, 4, 5],
      color: "#9d8df1",
    },
    {
      label: "Completed",
      icon: CheckCircle2 as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
      value: metrics.completed,
      delta: "+5",
      spark: [10, 12, 14, 18, 22, 26, 32, 38],
      color: "#64ffda",
    },
  ];

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ─────────── SIDEBAR ─────────── */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <div className="glass-card flex h-full flex-col p-4">
            {/* User greeting card */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-violet-600/15 via-navy-800/60 to-mint-300/10 p-4">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-mint-300/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <GradientAvatar
                  initial={(profile?.name || "A").charAt(0)}
                  size={42}
                  variant={isSuperadmin ? "violet" : "mint"}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {profile?.name || "Admin"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-mint-300">
                    {profile?.role}
                  </div>
                </div>
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
                Workspace
              </div>
              {SIDEBAR_NAV.map((item) => {
                const isActive = activeNav === item.id;
                const unreadCount = item.id === "notifications"
                  ? loadSubmissions().filter((s) => !getMeta(s.id).readAt).length
                  : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "projects" && (
                      <span className="rounded-md bg-mint-300/15 px-1.5 py-0.5 text-[10px] font-bold text-mint-300">
                        {metrics.total}
                      </span>
                    )}
                    {item.id === "notifications" && unreadCount > 0 && (
                      <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick stat tile at bottom */}
            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500">
                  <TrendingUp className="h-3 w-3 text-mint-300" /> Completion rate
                </div>
                <div className="mt-1 text-2xl font-bold text-white">{completionRate}%</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-300 to-violet-600 transition-all duration-1000"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─────────── MAIN ─────────── */}
        <main className="min-w-0">
          {/* Top bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-mint-300/10 px-3 py-1 text-xs font-medium text-mint-300">
                <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Welcome back, {profile?.name?.split(" ")[0] || "Admin"} 👋
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                Logged in as <span className="font-mono text-mint-300">{profile?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm" title="Notifications">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
                <span className="ml-1 rounded-md bg-mint-300/20 px-1.5 py-0.5 text-[10px] font-bold text-mint-300">3</span>
              </button>
              {isSuperadmin && (
                <button onClick={() => setView("superadmin")} className="btn-ghost text-sm">
                  <Shield className="h-4 w-4" /> Superadmin
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Metric cards */}
          {activeNav === "notifications" ? (
            <div className="mt-6">
              <NotificationsPanel />
            </div>
          ) : (
          <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className="glass-card-hover group p-5 animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] ring-1 ring-white/10">
                    <m.icon
                      className={`h-5 w-5 ${m.label === "In Progress" ? "animate-spin-fast" : ""}`}
                      style={{ color: m.color }}
                    />
                  </div>
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {m.delta}
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold text-white">{m.value}</div>
                <div className="flex items-end justify-between">
                  <span className="text-xs uppercase tracking-wider text-ink-400">{m.label}</span>
                  <Sparkline data={m.spark} color={m.color} width={56} height={20} />
                </div>
              </div>
            ))}
          </div>

          {/* Gauges + Chart row */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Two gauges */}
            <div className="glass-card p-6 animate-fade-up stagger-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
                <Activity className="h-3.5 w-3.5 text-mint-300" /> Project health
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <CircularGauge
                    value={completionRate}
                    size={92}
                    stroke={8}
                    sublabel="done"
                    gradientFrom="#64ffda"
                    gradientTo="#26d0a8"
                  />
                </div>
                <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <CircularGauge
                    value={activeRate}
                    size={92}
                    stroke={8}
                    sublabel="active"
                    gradientFrom="#667eea"
                    gradientTo="#764ba2"
                  />
                </div>
              </div>
            </div>

            {/* Revenue trend area chart */}
            <div className="glass-card p-6 animate-fade-up stagger-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
                    <TrendingUp className="h-3.5 w-3.5 text-mint-300" /> Revenue trend
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    $284.5k
                    <span className="ml-2 text-xs font-normal text-emerald-300">+18.2%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 text-[10px]">
                  {["1M", "3M", "6M", "1Y"].map((t, i) => (
                    <button
                      key={t}
                      className={`rounded-md px-2 py-1 ${
                        i === 2 ? "bg-mint-300/15 text-mint-300" : "text-ink-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <MiniAreaChart
                  data={REVENUE_DATA}
                  width={520}
                  height={140}
                  stroke="#64ffda"
                  fillFrom="rgba(100, 255, 218, 0.30)"
                  fillTo="rgba(100, 255, 218, 0)"
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>

          {/* Activity + Weekly bars */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="glass-card p-6 animate-fade-up stagger-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
                    <Activity className="h-3.5 w-3.5 text-violet-300" /> Team activity
                  </div>
                  <div className="mt-1 text-sm text-ink-200">Submissions per week</div>
                </div>
                <span className="badge badge-progress">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-300" /> Live
                </span>
              </div>
              <div className="mt-4 flex items-end">
                <MiniBarChart data={WEEKLY_BARS} width={520} height={120} barWidth={32} gap={18} />
              </div>
            </div>

            <div className="glass-card p-6 animate-fade-up stagger-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
                <TrendingUp className="h-3.5 w-3.5 text-mint-300" /> Throughput
              </div>
              <div className="mt-3 text-3xl font-bold text-white">
                304<span className="text-base font-normal text-ink-400">.56</span>
              </div>
              <div className="mt-1 text-xs text-emerald-300">+12.4% vs last month</div>
              <div className="mt-4">
                <MiniAreaChart
                  data={ACTIVITY_DATA}
                  width={240}
                  height={70}
                  stroke="#667eea"
                  fillFrom="rgba(102, 126, 234, 0.30)"
                  fillTo="rgba(102, 126, 234, 0)"
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Project submissions</h2>
              <p className="mt-1 text-xs text-ink-400">{filtered.length} of {projects.length} shown</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by client or title…"
                  className="input-field w-64 py-2 pl-10 text-sm"
                />
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                <Filter className="ml-1.5 mr-1 h-3.5 w-3.5 text-ink-500" />
                {["All", ...STATUSES].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                      filter === s ? "bg-mint-300/15 text-mint-300" : "text-ink-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project grid */}
          <div className="mt-4 grid gap-3">
            {filtered.length === 0 && (
              <div className="glass-card p-10 text-center text-sm text-ink-400">
                No projects match your filters.
              </div>
            )}
            {filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="glass-card-hover group p-4 text-left animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={STATUS_CLASS[p.status]}>{p.status}</span>
                      <span className="text-base font-semibold text-white">{p.projectTitle}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {p.clientName}</span>
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {p.clientEmail}</span>
                      <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> {p.budget}</span>
                      <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" /> {p.attachments.length} files</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-400">
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs">
                      <StickyNote className="h-3 w-3" /> {p.notes.length} notes
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail drawer */}
          {selected && (
            <DetailDrawer project={selected} onClose={() => setSelected(null)} />
          )}
          </>
          )}
        </main>
      </div>
    </div>
  );
}

function DetailDrawer({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [localNotes, setLocalNotes] = useState<ProjectNote[]>(project.notes);
  const [status, setStatus] = useState<Project["status"]>(project.status);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLocalNotes([
      ...localNotes,
      {
        author: "You",
        text: note.trim(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-navy-900/95 backdrop-blur-xl animate-scale-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-navy-900/90 px-6 py-4 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className={STATUS_CLASS[status]}>{status}</span>
              <span className="text-[11px] text-ink-500">ID: {project.id}</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-white">{project.projectTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Client</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={User} label="Name" value={project.clientName} />
              <InfoRow icon={Mail} label="Email" value={project.clientEmail} />
              <InfoRow icon={DollarSign} label="Budget" value={project.budget} />
              <InfoRow icon={Calendar} label="Submitted" value={project.createdAt} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Description</h3>
            <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-ink-200">
              {project.description}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Attachments</h3>
            <div className="space-y-2">
              {project.attachments.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                >
                  <Paperclip className="h-4 w-4 text-ink-400" />
                  <span className="flex-1 text-ink-200">{a}</span>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-mint-300 hover:text-mint-200">
                    <Eye className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Update status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    status === s
                      ? "bg-mint-300/15 text-mint-300 ring-1 ring-mint-300/40"
                      : "border border-white/10 bg-white/[0.02] text-ink-300 hover:bg-white/5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Internal notes ({localNotes.length})
            </h3>
            <div className="space-y-2">
              {localNotes.map((n, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between text-[11px] text-ink-500">
                    <span className="font-medium text-mint-300">{n.author}</span>
                    <span>{n.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-200">{n.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an internal note for the team…"
                className="input-field flex-1 text-sm"
              />
              <button type="submit" className="btn-primary text-sm">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 text-sm text-ink-100">{value}</div>
    </div>
  );
}
