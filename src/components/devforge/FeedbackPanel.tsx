"use client";

// FeedbackPanel — superadmin moderation queue for client-submitted
// testimonials.
//
// Lives inside the SuperAdmin console (Feedback tab).
// Reads from /home/z/my-project/src/lib/feedback.ts (MongoDB-backed via
// /api/feedback, with localStorage as a read cache).
//
// Cross-device sync:
//   • refreshFeedback("all") pulls from MongoDB on mount + every 30s
//   • Custom 'theshield:feedback-updated' event fires whenever the cache
//     is refreshed — same-tab updates are instant
//   • Native 'storage' event fires in OTHER tabs of the same browser
//   • Approve/Reject/Feature/Delete all write to MongoDB + refresh cache
//     so changes propagate cross-device on next poll

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  Inbox,
  Sparkles,
  CheckCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  loadAllFeedback,
  refreshFeedback,
  approveFeedback,
  rejectFeedback,
  toggleFeatured,
  deleteFeedback,
  countPendingFeedback,
  FEEDBACK_UPDATED_EVENT,
  type Feedback,
  type FeedbackStatus,
} from "@/lib/feedback";

type Filter = "all" | "pending" | "approved" | "featured" | "rejected";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "featured", label: "Featured" },
  { id: "rejected", label: "Rejected" },
];

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
  return `${d}d ago`;
}

const STATUS_PILL: Record<FeedbackStatus, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
  },
  approved: {
    label: "Approved",
    cls: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30",
  },
};

export default function FeedbackPanel() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const previousPendingRef = useRef<number>(0);

  const refresh = () => setItems(loadAllFeedback());

  useEffect(() => {
    refresh();
    previousPendingRef.current = countPendingFeedback();

    // Cross-device: pull fresh from MongoDB on mount
    refreshFeedback("all").catch(() => {});

    const onStorage = (e: StorageEvent) => {
      if (e.key === "theshield_feedback" || e.key === null) {
        refresh();
        const newPending = countPendingFeedback();
        if (newPending > previousPendingRef.current) {
          setToast(
            `New feedback submitted — ${newPending - previousPendingRef.current} awaiting review`
          );
          setTimeout(() => setToast(null), 5000);
        }
        previousPendingRef.current = newPending;
      }
    };
    const onCustom = () => {
      refresh();
      const newPending = countPendingFeedback();
      if (newPending > previousPendingRef.current) {
        setToast(
          `New feedback submitted — ${newPending - previousPendingRef.current} awaiting review`
        );
        setTimeout(() => setToast(null), 5000);
      }
      previousPendingRef.current = newPending;
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(FEEDBACK_UPDATED_EVENT, onCustom);

    // Safety-net poll every 30s — catches cross-device changes
    const interval = setInterval(() => {
      refreshFeedback("all").catch(() => {});
    }, 30000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FEEDBACK_UPDATED_EVENT, onCustom);
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "featured") return items.filter((f) => f.featured);
    return items.filter((f) => f.status === filter);
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((f) => f.status === "pending").length,
      approved: items.filter((f) => f.status === "approved").length,
      featured: items.filter((f) => f.featured).length,
      rejected: items.filter((f) => f.status === "rejected").length,
    }),
    [items]
  );

  const handleApprove = (id: string) => {
    approveFeedback(id);
    refresh();
  };
  const handleReject = (id: string) => {
    rejectFeedback(id);
    refresh();
  };
  const handleFeature = (id: string) => {
    toggleFeatured(id);
    refresh();
  };
  const handleDelete = (id: string) => {
    if (pendingDelete === id) {
      deleteFeedback(id);
      setPendingDelete(null);
      refresh();
    } else {
      setPendingDelete(id);
      setTimeout(() => setPendingDelete(null), 4000);
    }
  };

  const approveAllPending = () => {
    items.filter((f) => f.status === "pending").forEach((f) => approveFeedback(f.id));
    refresh();
  };

  return (
    <div className="relative space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 animate-fade-up rounded-xl border border-mint-300/30 bg-navy-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-mint-300">
            <Sparkles className="h-4 w-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint-300/10 px-3 py-1 text-xs font-medium text-mint-300">
            <MessageSquare className="h-3.5 w-3.5" /> Feedback moderation
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Client <span className="text-gradient-animated">testimonials</span>
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            Review testimonials submitted from the public site. Approved entries appear on the
            homepage "Client love" section.
          </p>
        </div>
        {counts.pending > 0 && (
          <button onClick={approveAllPending} className="btn-ghost text-sm">
            <CheckCheck className="h-4 w-4" /> Approve all pending ({counts.pending})
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const n = counts[f.id];
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-mint-300/15 text-mint-300 ring-1 ring-mint-300/30"
                  : "bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-mint-300/20 text-mint-200" : "bg-white/5 text-ink-400"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-500" />
          <p className="text-sm text-ink-400">
            {filter === "pending"
              ? "No pending feedback — you're all caught up."
              : filter === "all"
                ? "No feedback yet. Once clients submit testimonials, they'll appear here."
                : `No ${filter} feedback.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const pill = STATUS_PILL[f.status];
            const isPendingDelete = pendingDelete === f.id;
            return (
              <div
                key={f.id}
                className="glass-card overflow-hidden p-5 animate-fade-up"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Left: avatar + author */}
                  <div className="flex items-start gap-3 sm:w-56 sm:shrink-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/10"
                      style={{
                        background:
                          f.variant === "mint"
                            ? "linear-gradient(135deg, rgba(100, 255, 218, 0.30), rgba(102, 126, 234, 0.15))"
                            : f.variant === "violet"
                              ? "linear-gradient(135deg, rgba(102, 126, 234, 0.30), rgba(118, 75, 162, 0.15))"
                              : "linear-gradient(135deg, rgba(155, 126, 234, 0.30), rgba(118, 75, 162, 0.10))",
                      }}
                    >
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{f.name}</div>
                      <div className="truncate text-xs text-ink-400">{f.role}</div>
                      <div className="mt-1 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < f.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-white/5 text-white/15"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-500">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(f.createdAt)}
                        {f.source === "seed" && (
                          <span className="ml-1 rounded bg-white/5 px-1 py-0.5">seed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: quote + actions */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.cls}`}
                      >
                        {pill.label}
                      </span>
                      {f.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-ink-200">&ldquo;{f.quote}&rdquo;</p>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {f.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(f.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {f.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(f.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      {f.status === "approved" && (
                        <button
                          onClick={() => handleFeature(f.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            f.featured
                              ? "bg-amber-400/20 text-amber-200 hover:bg-amber-400/30"
                              : "bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              f.featured ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                          {f.featured ? "Unfeature" : "Feature"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(f.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isPendingDelete
                            ? "bg-rose-500 text-white hover:bg-rose-600"
                            : "bg-white/[0.03] text-rose-300 hover:bg-rose-500/15"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isPendingDelete ? "Confirm delete?" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
