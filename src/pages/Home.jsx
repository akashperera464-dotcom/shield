/**
 * Home — Public Portfolio (placeholder for Step 3).
 *
 * In Step 3 this page will:
 *   • Fetch hero text + background imagery from `siteContent/globalConfig`.
 *   • Render a multi-step project submission form with Cloudinary uploads.
 *   • Render a real-time status tracker (search by email).
 *
 * For now we render a polished hero + skeleton anchors so the layout
 * and animations can be reviewed while Firebase creds are pending.
 */
import React, { useEffect, useState } from 'react'
import {
  ArrowRight, Cloud, Cpu, Layers, Rocket, Search, Send,
  Sparkles, ShieldCheck, Zap, CheckCircle2, Clock, Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { isFirebaseReady } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: Layers,
    title: 'Full-Stack Craft',
    desc: 'React, Next.js, Node, Firebase — production codebases engineered to scale.',
  },
  {
    icon: Cpu,
    title: 'Cloud-Native',
    desc: 'Cloudinary media, Firestore data, serverless functions. Built for the modern web.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    desc: 'Role-based access, protected routes, and audit trails baked into every layer.',
  },
  {
    icon: Zap,
    title: 'Rapid Delivery',
    desc: 'Two-week sprints, real-time progress tracking, transparent communication.',
  },
]

const STATS = [
  { label: 'Projects shipped', value: '120+' },
  { label: 'Avg. delivery',    value: '6 wks' },
  { label: 'Client retention', value: '94%'   },
  { label: 'Time zones',       value: '9'     },
]

const STATUS_FLOW = [
  { label: 'Pending',      icon: Clock,        className: 'badge-pending' },
  { label: 'In Progress',  icon: Loader2,      className: 'badge-progress' },
  { label: 'Under Review', icon: Search,       className: 'badge-review' },
  { label: 'Completed',    icon: CheckCircle2, className: 'badge-completed' },
]

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [ready, setReady] = useState(isFirebaseReady)

  useEffect(() => {
    setReady(isFirebaseReady)
  }, [])

  return (
    <div className="relative">
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Copy */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-200 animate-fade-up stagger-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              Now accepting Q3 2026 projects
            </div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl animate-fade-up stagger-2">
              We build software
              <br />
              that <span className="text-gradient-animated text-shadow-glow">ships</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300 animate-fade-up stagger-3">
              DevForge is a senior-only product studio. Bring us your wireframes — we'll
              ship a production-ready React app with Firebase, Cloudinary, and role-based
              admin tooling in weeks, not months.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up stagger-4">
              <a href="#submit" className="btn-primary">
                <Send className="h-4 w-4" /> Submit a Project
              </a>
              <a href="#track" className="btn-ghost">
                <Search className="h-4 w-4" /> Track Status
              </a>
              {isAuthenticated && isAdmin && (
                <Link to="/dashboard" className="btn-ghost">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {!ready && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 animate-fade-in">
                <Cloud className="h-4 w-4" />
                Preview mode — add Firebase credentials to <code>.env</code> to enable live data.
              </div>
            )}
          </div>

          {/* Floating preview card */}
          <div className="lg:col-span-5">
            <div className="relative animate-scale-in stagger-3">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-transparent blur-2xl animate-pulse-glow" />
              <div className="relative glass-card overflow-hidden p-1">
                <div className="rounded-[14px] bg-ink-900/80 p-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                      <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="font-mono text-[10px] text-ink-400">devforge.app/track</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {STATUS_FLOW.map((s, i) => (
                      <div
                        key={s.label}
                        className={`flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 animate-fade-up`}
                        style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <s.icon className={`h-4 w-4 ${i === 1 ? 'animate-spin' : ''} text-ink-300`} />
                          <span className="text-sm text-ink-200">{s.label}</span>
                        </div>
                        <span className={s.className}>
                          {i === 1 && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-300" />}
                          step {i + 1}/4
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── STATS ─────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="font-display text-3xl font-bold text-gradient-animated sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-ink-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── FEATURES ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300">
            What we ship
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Engineering, end-to-end
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">
            From idea to deployment — every layer of the stack handled by senior engineers
            who care about maintainability as much as they care about pixels.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card-hover group p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110">
                <f.icon className="h-6 w-6 text-brand-200" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── SUBMIT ─────────────────────────── */}
      <section id="submit" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="glass-card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="relative p-10 lg:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
                <Rocket className="h-3.5 w-3.5" /> Step 3 · Coming next
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold text-white">
                Submit your project
              </h2>
              <p className="mt-3 text-ink-300">
                Drag-and-drop your wireframes straight to Cloudinary — no login required.
                We'll reply within 48 hours with a scope + estimate.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-200">
                {['Multi-step wizard', 'Direct Cloudinary upload', 'Auto-saved to Firestore', 'Email-based tracking'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative border-t border-white/5 bg-ink-900/40 p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                  <Cloud className="mx-auto h-8 w-8 text-ink-400" />
                  <p className="mt-2 text-sm text-ink-300">Drop wireframes here</p>
                  <p className="text-xs text-ink-500">PNG, JPG, PDF — up to 25MB</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 rounded-lg bg-white/5" />
                  <div className="h-10 rounded-lg bg-white/5" />
                </div>
                <div className="h-10 rounded-lg bg-white/5" />
                <button disabled className="btn-primary w-full opacity-50">
                  <Sparkles className="h-4 w-4" /> Multi-step form ships in Step 3
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── TRACK ─────────────────────────── */}
      <section id="track" className="mx-auto max-w-4xl px-6 py-20 scroll-mt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-400">
            <Search className="h-3.5 w-3.5" /> Step 4 · Coming next
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white">
            Track your submission
          </h2>
          <p className="mt-3 text-ink-300">
            Enter the email you used to submit — we'll show every project and its live status.
          </p>
        </div>
        <div className="mt-8 glass-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@company.com"
              className="input-field flex-1"
              disabled
            />
            <button disabled className="btn-primary opacity-50">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-ink-500">
            Real-time tracker wiring lands in Step 4.
          </p>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ─────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-ink-400 sm:flex-row">
          <span>© {new Date().getFullYear()} DevForge — Built with React + Vite + Firebase.</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-300" /> Crafted with care.
          </span>
        </div>
      </footer>
    </div>
  )
}
