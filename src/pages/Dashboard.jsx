/**
 * Dashboard — Admin project management (placeholder for Step 5).
 *
 * In Step 5 this page will:
 *   • Show metric summary cards (Total / Pending / Completed).
 *   • Render an interactive grid of all `projects` docs.
 *   • Open a detail drawer to update status + push notes objects.
 *
 * For now it shows the live auth profile + a polished empty state so
 * admins can confirm their role guard works end-to-end.
 */
import React from 'react'
import {
  LayoutDashboard, Inbox, Clock, CheckCircle2, Loader2,
  Search, Filter, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isFirebaseReady } from '../firebase/config'

const METRICS = [
  { label: 'Total Projects', icon: Inbox,           value: '—', accent: 'from-brand-500/20 to-brand-500/5' },
  { label: 'Pending',        icon: Clock,           value: '—', accent: 'from-amber-500/20 to-amber-500/5' },
  { label: 'In Progress',    icon: Loader2,         value: '—', accent: 'from-blue-500/20 to-blue-500/5' },
  { label: 'Completed',      icon: CheckCircle2,    value: '—', accent: 'from-emerald-500/20 to-emerald-500/5' },
]

export default function Dashboard() {
  const { profile, isSuperadmin } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
            <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {profile?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Logged in as <span className="font-mono text-brand-300">{profile?.email}</span>
            {' · '}role <span className="font-mono text-brand-300">{profile?.role}</span>
          </p>
        </div>
        {isSuperadmin && (
          <a
            href="/superadmin"
            className="btn-ghost text-sm"
          >
            Open Superadmin →
          </a>
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
              <m.icon className="h-4 w-4 text-ink-300" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold text-white">Project submissions</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Search by client or title…"
              className="input-field pl-10 py-2 text-sm"
              disabled
            />
          </div>
          <button className="btn-ghost text-sm" disabled>
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="mt-6 glass-card p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 ring-1 ring-brand-500/30">
          <Inbox className="h-8 w-8 text-brand-300" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-white">
          Project listings arrive in Step 5
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-400">
          {isFirebaseReady
            ? 'Firebase is connected — the next step wires up the live `projects` collection, status filters, and the detail drawer with internal notes.'
            : 'Add Firebase credentials to .env to start receiving real submissions from the public site.'}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-300">
          <ChevronRight className="h-3.5 w-3.5" /> Status badges · detail drawer · internal notes — all in Step 5
        </div>
      </div>
    </div>
  )
}
