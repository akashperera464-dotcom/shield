/**
 * Home — Public Portfolio (placeholder for Step 3).
 *
 * Full company landing page with the following sections:
 *   • Hero — animated headline + status-flow preview card
 *   • Trusted-by marquee
 *   • Stats band
 *   • Services — what we build
 *   • Process — how we work (4-step timeline)
 *   • Tech stack
 *   • Testimonials
 *   • Submit Project anchor (Step 3 wiring)
 *   • Track Status anchor (Step 4 wiring)
 *   • CTA + Footer
 *
 * In Step 3 the hero text + imagery will be fetched from
 * `siteContent/globalConfig`. For now we render sensible defaults.
 */
import React, { useEffect, useState } from 'react'
import {
  ArrowRight, Cloud, Cpu, Layers, Rocket, Search, Send,
  Sparkles, ShieldCheck, Zap, CheckCircle2, Clock, Loader2,
  Code2, Database, Smartphone, Palette, GitBranch, Globe,
  Quote, Star, Mail, MessageSquare, MapPin, Phone,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { isFirebaseReady } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const STATS = [
  { label: 'Projects shipped', value: '120+' },
  { label: 'Avg. delivery',    value: '6 wks' },
  { label: 'Client retention', value: '94%'   },
  { label: 'Time zones',       value: '9'     },
]

const SERVICES = [
  {
    icon: Code2,
    title: 'Web Apps',
    desc: 'Production React + Next.js apps with SSR, role-based auth, and scalable component systems.',
    tags: ['React', 'Next.js', 'Vite'],
  },
  {
    icon: Smartphone,
    title: 'Mobile-First UX',
    desc: 'Pixel-perfect responsive design that ships beautifully from 320px phones to 4K monitors.',
    tags: ['Tailwind', 'Framer Motion', 'PWA'],
  },
  {
    icon: Database,
    title: 'Backend & APIs',
    desc: 'Firebase, Supabase, or custom Node/Express APIs with proper schemas and audit trails.',
    tags: ['Firestore', 'Node', 'REST'],
  },
  {
    icon: Palette,
    title: 'Brand & Design Systems',
    desc: 'Tokens, design docs, and reusable component libraries your team can actually maintain.',
    tags: ['Figma', 'Tokens', 'Storybook'],
  },
  {
    icon: Cloud,
    title: 'Cloud & DevOps',
    desc: 'Cloudinary media pipelines, CI/CD, and one-click deploys to Vercel, Netlify, or AWS.',
    tags: ['Cloudinary', 'GitHub Actions', 'Vercel'],
  },
  {
    icon: ShieldCheck,
    title: 'Security & Audits',
    desc: 'Role-based access, protected routes, and security audits baked into every codebase.',
    tags: ['RBAC', 'Auth', 'OWASP'],
  },
]

const PROCESS = [
  {
    n: '01',
    icon: Send,
    title: 'Submit Project',
    desc: 'Drop your wireframes via Cloudinary and tell us about scope, budget, and timeline.',
  },
  {
    n: '02',
    icon: MessageSquare,
    title: 'Discovery Call',
    desc: 'Within 48h we schedule a call to align on milestones, deliverables, and success metrics.',
  },
  {
    n: '03',
    icon: GitBranch,
    title: 'Build Sprint',
    desc: 'Two-week sprints with weekly demos. You watch your product come alive in real time.',
  },
  {
    n: '04',
    icon: Rocket,
    title: 'Launch & Support',
    desc: 'We ship to production, hand over docs, and stay on retainer for iteration sprints.',
  },
]

const TECH = ['React', 'Next.js', 'Vite', 'TypeScript', 'Tailwind', 'Firebase', 'Cloudinary', 'Node', 'Supabase', 'Prisma', 'Framer Motion', 'Vercel']

const TESTIMONIALS = [
  {
    quote: "DevForge took our Figma mess and shipped a polished React app in 5 weeks. The dashboard alone saved my team 12 hours a week.",
    name: 'Sara Al-Mansoori',
    role: 'CEO, Layla Cosmetics',
    initial: 'S',
    accent: 'from-brand-500/40 to-accent-500/30',
  },
  {
    quote: "The role-based admin panel is exactly what we needed. Superadmin can edit copy live, my ops team manages submissions — perfect.",
    name: 'Daniel Okafor',
    role: 'COO, FleetIQ',
    initial: 'D',
    accent: 'from-emerald-500/40 to-brand-500/30',
  },
  {
    quote: "Cloudinary uploads worked flawlessly from day one. Our clients upload 50MB wireframes and they appear in the admin instantly.",
    name: 'Mei Tanaka',
    role: 'Founder, Studio Mei',
    initial: 'M',
    accent: 'from-purple-500/40 to-accent-500/30',
  },
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

      {/* ─────────────────────────── MARQUEE ─────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015] py-6 overflow-hidden">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
          {[...TECH, ...TECH].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-sm font-medium text-ink-400">
              <span className="h-1 w-1 rounded-full bg-brand-400/60" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── STATS ─────────────────────────── */}
      <section className="border-b border-white/5 bg-white/[0.015]">
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

      {/* ─────────────────────────── SERVICES ─────────────────────────── */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300">
            What we build
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Services that cover the whole stack
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">
            From idea to deployment — every layer of the stack handled by senior engineers
            who care about maintainability as much as they care about pixels.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="glass-card-hover group p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110">
                <s.icon className="h-6 w-6 text-brand-200" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{s.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── PROCESS ─────────────────────────── */}
      <section id="process" className="relative mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-400">
            How we work
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            A 4-step path from idea to launch
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">
            Transparent sprints. Real-time status tracking. No black boxes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <div
              key={p.n}
              className="relative glass-card-hover p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute -top-4 left-6 font-display text-5xl font-bold text-white/10">
                {p.n}
              </div>
              <div className="relative">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10">
                  <p.icon className="h-5 w-5 text-brand-200" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{p.desc}</p>
              </div>
              {/* Connector arrow */}
              {i < PROCESS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink-600 lg:block">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── TECH STACK ─────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-400">
              The stack we ship with
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TECH.map((t, i) => (
              <span
                key={t}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-ink-200 transition-all duration-300 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-white animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300">
            Client love
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            What founders say about DevForge
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="glass-card-hover p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Quote className="h-7 w-7 text-brand-400/50" />
              <p className="mt-3 text-sm leading-relaxed text-ink-200">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.accent} font-display text-sm font-bold text-white ring-1 ring-white/10`}>
                  {t.initial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-ink-400">{t.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
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

      {/* ─────────────────────────── CTA ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-900/40 via-ink-900 to-accent-900/30 p-10 sm:p-14">
          <div className="absolute inset-0 -z-10 grid-backdrop opacity-60" />
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Got a project in mind?
              </h2>
              <p className="mt-2 max-w-xl text-ink-300">
                Tell us what you're building. We'll reply within 48 hours with a scope, timeline, and transparent quote.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="#submit" className="btn-primary">
                <Send className="h-4 w-4" /> Submit Project
              </a>
              <a href="mailto:hello@devforge.agency" className="btn-ghost">
                <Mail className="h-4 w-4" /> Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ─────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <span className="font-display text-lg font-semibold text-white">
                Dev<span className="text-gradient-animated">Forge</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-ink-400">
              Senior-only software studio building production React apps with Firebase, Cloudinary,
              and role-based admin tooling. Ship in weeks, not months.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Remote · 9 time zones</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> hello@devforge.agency</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +1 (555) 010-2026</span>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><a href="#process" className="hover:text-white">Process</a></li>
              <li><a href="#submit"  className="hover:text-white">Submit Project</a></li>
              <li><a href="#track"   className="hover:text-white">Track Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Stack</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li>React + Vite</li>
              <li>Firebase + Firestore</li>
              <li>Cloudinary</li>
              <li>Tailwind CSS</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-sm text-ink-400 sm:flex-row">
          <span>© {new Date().getFullYear()} DevForge — Built with React + Vite + Firebase.</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-300" /> Crafted with care.
          </span>
        </div>
      </footer>
    </div>
  )
}
