"use client";

// NotificationsPanel — inbox view of client project submissions.
//
// Lives inside both the Admin Dashboard and the SuperAdmin console.
// Reads from /home/z/my-project/src/lib/submissions.ts (MongoDB-backed
// via /api/submissions, with localStorage as a read cache).
//
// CRITICAL: cross-device sync works because:
//   • Source of truth is MongoDB (readAt, archived fields on the Submission row)
//   • refreshSubmissions() pulls fresh data on mount + every 30s
//   • The custom 'theshield:submissions-updated' window event fires whenever
//     the cache is refreshed — so same-tab updates are instant
//   • The native 'storage' event fires in OTHER tabs of the same browser
//
// Features:
//   • Live list of every submission, newest first
//   • "New" pill on items the admin hasn't opened yet (readAt = null)
//   • Filter: All / Unread / Today / This week
//   • Click a row to expand full details (brief, attachments, contact, status)
//   • Mark as read / Mark all as read (writes readAt to MongoDB)
//   • Change workflow status inline (Pending → In Progress → Under Review → Completed)
//   • Delete a submission
//   • Toast + browser notification when a new submission arrives while open

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Inbox,
  CheckCheck,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Building2,
  Calendar,
  Paperclip,
  ExternalLink,
  Briefcase,
  Clock,
  X,
  Loader2,
  Search,
} from "lucide-react";
import {
  loadSubmissions,
  refreshSubmissions,
  markRead,
  markAllRead,
  updateStatus,
  deleteSubmission,
  SUBMISSIONS_UPDATED_EVENT,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { STATUS_CLASS, STATUSES } from "@/data/demo";

type Filter = "all" | "unread" | "today" | "week";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(iso: string): boolean {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= 7 * 24 * 60 * 60 * 1000;
}

export default function NotificationsPanel() {
  const [items, setItems] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<Submission | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Initial load + live listeners for cross-device updates.
  useEffect(() => {
    const pull = () => {
      const next = loadSubmissions();
      // Detect brand-new submissions for the toast
      const known = knownIdsRef.current;
      const fresh = next.find((s) => !known.has(s.id));
      if (fresh && known.size > 0) {
        setToast(fresh);
        setTimeout(() => setToast(null), 6000);
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("New project submission", {
              body: `${fresh.name} — ${fresh.service}`,
            });
          } catch {}
        }
      }
      knownIdsRef.current = new Set(next.map((s) => s.id));
      setItems(next);
    };
    pull();
    // Cross-device fresh pull from MongoDB on mount
    refreshSubmissions().then((fresh) => { if (fresh) setItems(fresh); }).catch(() => {});

    // Listen for both custom event (same-tab) AND storage event (cross-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theshield_submissions" || e.key === null) pull();
    };
    const onCustom = () => pull();
    window.addEventListener("storage", onStorage);
    window.addEventListener(SUBMISSIONS_UPDATED_EVENT, onCustom);

    // Safety-net poll every 30s — catches changes from OTHER devices
    // (which neither event would fire for, since they're not in this browser).
    const interval = setInterval(() => {
      refreshSubmissions().then((fresh) => { if (fresh) setItems(fresh); }).catch(() => {});
    }, 30000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SUBMISSIONS_UPDATED_EVENT, onCustom);
      clearInterval(interval);
    };
  }, []);

  // Reset page when filter/search changes
  useEffect(() => { setPage(0); }, [filter, search]);

  // Seed the known-id set on first load so we don't toast for existing items
  useEffect(() => {
    if (knownIdsRef.current.size === 0 && items.length > 0) {
      knownIdsRef.current = new Set(items.map((s) => s.id));
    }
  }, [items]);

  // Ask for browser notification permission on mount (best-effort, no prompt spam)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const t = setTimeout(() => {
        try { Notification.requestPermission(); } catch {}
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const unreadCount = useMemo(
    () => items.filter((s) => !s.readAt).length,
    [items]
  );

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "unread") list = list.filter((s) => !s.readAt);
    else if (filter === "today") list = list.filter((s) => isToday(s.createdAt));
    else if (filter === "week") list = list.filter((s) => isThisWeek(s.createdAt));
    // Search: match name, email, service, brief, company
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q) ||
        s.brief.toLowerCase().includes(q) ||
        (s.company || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleExpand = (s: Submission) => {
    if (expandedId === s.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(s.id);
    if (!s.readAt) {
      // Optimistic update so the pill disappears immediately
      setItems((prev) => prev.map((x) => x.id === s.id ? { ...x, readAt: new Date().toISOString() } : x));
      markRead(s.id);
    }
  };

  const handleMarkAll = () => {
    markAllRead();
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
  };

  const handleStatusChange = (s: Submission, next: SubmissionStatus) => {
    updateStatus(s.id, next);
    setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
  };

  const handleDelete = (s: Submission) => {
    if (!window.confirm(`Delete submission from ${s.name}? This cannot be undone.`)) return;
    deleteSubmission(s.id);
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    if (expandedId === s.id) setExpandedId(null);
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all",    label: "All" },
    { id: "unread", label: "Unread" },
    { id: "today",  label: "Today" },
    { id: "week",   label: "This week" },
  ];

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint-300/10 px-3 py-1 text-xs font-medium text-mint-300">
            <Bell className="h-3.5 w-3.5" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-300">
                {unreadCount} new
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Client submissions inbox</h2>
          <p className="mt-1 text-sm text-ink-400">
            Every project submitted from the homepage lands here. Click a row to see the full brief, attachments, and contact info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Mark all as read"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
          {FILTERS.map((f) => {
            const count =
              f.id === "all" ? items.length
              : f.id === "unread" ? unreadCount
              : f.id === "today" ? items.filter((s) => isToday(s.createdAt)).length
              : items.filter((s) => isThisWeek(s.createdAt)).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  filter === f.id ? "bg-mint-300/15 text-mint-300" : "text-ink-400 hover:text-white"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-[10px] text-ink-500">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, service, brief…"
            className="input-field pl-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-500 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-5 grid gap-2">
        {paged.length === 0 && (
          <div className="glass-card p-10 text-center">
            <Inbox className="mx-auto h-8 w-8 text-ink-500" />
            <p className="mt-3 text-sm text-ink-400">
              {search
                ? `No submissions match "${search}".`
                : filter === "unread"
                ? "You're all caught up — no unread submissions."
                : "No submissions match this filter yet."}
            </p>
          </div>
        )}

        {paged.map((s) => {
          const isUnread = !s.readAt;
          const isOpen = expandedId === s.id;
          return (
            <div
              key={s.id}
              className={`glass-card overflow-hidden transition-all duration-200 ${
                isUnread ? "ring-1 ring-mint-300/30" : ""
              }`}
            >
              {/* Row */}
              <button
                onClick={() => handleExpand(s)}
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-white/[0.02]"
              >
                {/* Avatar / unread dot */}
                <div className="mt-0.5 flex-shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isUnread
                        ? "bg-gradient-to-br from-mint-300/30 to-violet-600/30 text-mint-200"
                        : "bg-white/5 text-ink-300"
                    }`}
                  >
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Main */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnread && (
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-300">
                        New
                      </span>
                    )}
                    <span className={STATUS_CLASS[s.status]}>{s.status}</span>
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <span className="text-xs text-ink-500">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                      <Briefcase className="h-3 w-3" /> {s.service}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-ink-300">
                    {s.brief}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {s.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {timeAgo(s.createdAt)}
                    </span>
                    {s.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> {s.attachments.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div className="flex-shrink-0 self-center text-ink-500">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div className="border-t border-white/5 bg-white/[0.015] p-5 animate-fade-in">
                  <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
                    {/* Brief + attachments */}
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                        Project brief
                      </h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-200">
                        {s.brief}
                      </p>

                      {s.attachments.length > 0 && (
                        <>
                          <h4 className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                            Attachments ({s.attachments.length})
                          </h4>
                          <div className="mt-2 grid gap-1.5">
                            {s.attachments.map((a, i) => (
                              <a
                                key={i}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-ink-300 hover:border-mint-300/30 hover:text-mint-200"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="flex-1 truncate">{a.name}</span>
                                <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Contact + status + actions */}
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                          Contact
                        </div>
                        <div className="mt-2 space-y-1.5 text-ink-300">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-ink-500" /> {s.name}
                          </div>
                          <a
                            href={`mailto:${s.email}`}
                            className="flex items-center gap-2 hover:text-mint-200"
                          >
                            <Mail className="h-3 w-3 text-ink-500" /> {s.email}
                          </a>
                          {s.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-ink-500" /> {s.company}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-ink-500" />
                            {new Date(s.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                          Status
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(s, st)}
                              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                                s.status === st
                                  ? "bg-mint-300/20 text-mint-200"
                                  : "bg-white/5 text-ink-400 hover:text-white"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(s)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-3 w-3" /> Delete submission
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
          <div>
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-2 text-ink-500">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Toast for new submissions */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-mint-300/30 bg-navy-900/95 p-4 shadow-2xl backdrop-blur-xl animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mint-300/30 to-violet-600/30 text-mint-200">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">New submission</div>
              <div className="mt-0.5 truncate text-xs text-ink-300">
                <span className="font-medium text-white">{toast.name}</span> · {toast.service}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-ink-400">{toast.brief}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-ink-500 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
