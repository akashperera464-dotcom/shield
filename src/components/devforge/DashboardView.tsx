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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DEMO_PROJECTS,
  STATUS_CLASS,
  STATUSES,
  type Project,
  type ProjectNote,
} from "@/data/demo";

export default function DashboardView() {
  const { profile, isSuperadmin, isDemo, setView } = useAuth();
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);

  const metrics = useMemo(
    () => ({
      total: projects.length,
      pending: projects.filter((p) => p.status === "Pending").length,
      progress: projects.filter((p) => p.status === "In Progress").length,
      completed: projects.filter((p) => p.status === "Completed").length,
    }),
    [projects]
  );

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

  const METRICS = [
    { label: "Total Projects", icon: Inbox,        value: metrics.total,     accent: "from-brand-500/20 to-brand-500/5" },
    { label: "Pending",        icon: Clock,        value: metrics.pending,   accent: "from-amber-500/20 to-amber-500/5" },
    { label: "In Progress",    icon: Loader2,      value: metrics.progress,  accent: "from-blue-500/20 to-blue-500/5" },
    { label: "Completed",      icon: CheckCircle2, value: metrics.completed, accent: "from-emerald-500/20 to-emerald-500/5" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
            <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
            {isDemo && (
              <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                Demo
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {profile?.name?.split(" ")[0] || "Admin"} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Logged in as <span className="font-mono text-brand-300">{profile?.email}</span>
            {" · "}role <span className="font-mono text-brand-300">{profile?.role}</span>
          </p>
        </div>
        {isSuperadmin && (
          <button onClick={() => setView("superadmin")} className="btn-ghost text-sm">
            Open Superadmin <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map((m, i) => (
          <div
            key={m.label}
            className={`glass-card-hover p-5 animate-fade-up bg-gradient-to-br ${m.accent}`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-ink-300">{m.label}</span>
              <m.icon
                className={`h-4 w-4 text-ink-300 ${m.label === "In Progress" ? "animate-spin" : ""}`}
              />
            </div>
            <div className="mt-2 text-3xl font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Project submissions</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client or title…"
              className="input-field pl-10 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <Filter className="ml-1.5 mr-1 h-3.5 w-3.5 text-ink-500" />
            {["All", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                  filter === s ? "bg-brand-500/20 text-brand-200" : "text-ink-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project grid */}
      <div className="mt-6 grid gap-4">
        {filtered.length === 0 && (
          <div className="glass-card p-10 text-center text-sm text-ink-400">
            No projects match your filters.
          </div>
        )}
        {filtered.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="glass-card-hover group p-5 text-left animate-fade-up"
            style={{ animationDelay: `${i * 0.05}s` }}
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
        <DetailDrawer project={selected} onClose={() => setSelected(null)} isDemo={isDemo} />
      )}
    </div>
  );
}

function DetailDrawer({
  project,
  onClose,
  isDemo,
}: {
  project: Project;
  onClose: () => void;
  isDemo: boolean;
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
      <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-ink-950/95 backdrop-blur-xl animate-scale-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink-950/90 px-6 py-4 backdrop-blur-xl">
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
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-300 hover:text-brand-200">
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
                      ? "bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40"
                      : "border border-white/10 bg-white/[0.02] text-ink-300 hover:bg-white/5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {isDemo && (
              <p className="mt-2 text-[11px] text-ink-500">
                Demo mode — status changes are local only. Step 5 wiring will persist to Firestore.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Internal notes ({localNotes.length})
            </h3>
            <div className="space-y-2">
              {localNotes.map((n, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between text-[11px] text-ink-500">
                    <span className="font-medium text-brand-300">{n.author}</span>
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
