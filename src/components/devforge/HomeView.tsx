"use client";

import React, { useState, useEffect } from "react";
import {
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  ArrowUpRight,
  ExternalLink,
  FolderKanban,
  ArrowRight,
  Cloud,
  Code2,
  Database,
  Smartphone,
  Palette,
  GitBranch,
  Globe,
  Quote,
  Star,
  Mail,
  MessageSquare,
  MapPin,
  Phone,
  Send,
  Search,
  Sparkles,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Clock,
  Brain,
  Cpu,
  Network,
  Layout,
  Megaphone,
  ServerCog,
  TrendingUp,
  Building2,
  ShoppingCart,
  Landmark,
  HeartPulse,
  Truck,
  Home as HomeIcon,
  Plane,
  GraduationCap,
  Factory,
  Bot,
  Trophy,
  Users,
  MapPinned,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CircularGauge, MiniAreaChart, MiniBarChart, Sparkline } from "./Charts";
import {
  uploadFile,
  validateFile,
  formatBytes,
  UPLOAD_CONFIGURED,
  MAX_FILES,
  type UploadedFile,
  type UploadProgress,
} from "@/lib/uploads";
import { loadShowcase } from "@/lib/showcase";
import { addSubmission, loadSubmissions, seedDemoSubmissions, type Submission } from "@/lib/submissions";
import type { ShowcaseProject } from "@/data/demo";

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png";

const STATS = [
  { label: "Years Experience",        value: "10+", spark: [3, 4, 5, 6, 7, 8, 9, 10], color: "#64ffda" },
  { label: "Apps, Software & Sites",  value: "100+", spark: [40, 50, 60, 70, 80, 85, 95, 100], color: "#667eea" },
  { label: "Service Locations",       value: "15+",  spark: [5, 7, 9, 10, 11, 13, 14, 15], color: "#9d8df1" },
  { label: "Happy Customers",         value: "45+",  spark: [10, 15, 20, 25, 30, 35, 40, 45], color: "#64ffda" },
];

const SERVICES = [
  {
    icon: Brain,
    title: "Artificial Intelligence",
    desc: "AI simulates human intelligence in machines, enabling them to think, learn, and make decisions to improve efficiency.",
    tags: ["AI", "Automation", "Decision"],
  },
  {
    icon: Cpu,
    title: "Machine Learning",
    desc: "Subset of AI that enables systems to learn from data, identify patterns, and make predictions with minimal human intervention.",
    tags: ["ML", "Predictions", "Data"],
  },
  {
    icon: Network,
    title: "SharePoint Integration",
    desc: "Connects SharePoint with applications to streamline management, collaboration, and workflows across teams.",
    tags: ["SharePoint", "Collab", "Workflow"],
  },
  {
    icon: ServerCog,
    title: "NetSuite Integration",
    desc: "Integrating NetSuite with systems unifies operations, automates data flow, and boosts productivity.",
    tags: ["NetSuite", "ERP", "Automation"],
  },
  {
    icon: Palette,
    title: "Graphic Design",
    desc: "Creative visual design for brands — logos, marketing collateral, social media assets, and complete brand identity systems that captivate and convert.",
    tags: ["Branding", "Logo", "Visual Identity"],
  },
  {
    icon: Code2,
    title: "Software Development",
    desc: "Process involving creation, maintenance of applications, frameworks — design, programming, testing, and bug fixing.",
    tags: ["Custom", "Full-cycle", "Maintenance"],
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    desc: "Developing apps suitable for mobile devices — writing software for small, wireless computing devices.",
    tags: ["iOS", "Android", "Hybrid"],
  },
  {
    icon: Globe,
    title: "Website Development",
    desc: "Building and maintaining websites — makes the site look great, work quickly, with firm user experience.",
    tags: ["Web", "Performance", "UX"],
  },
  {
    icon: Layout,
    title: "UI / UX Designing",
    desc: "Increases user experience and customer satisfaction, which ultimately grows the number of customers and business.",
    tags: ["Design", "UX", "UI"],
  },
  {
    icon: Database,
    title: "CRM Software Development",
    desc: "Tools and techniques that help companies build healthy relationships with customers by organizing the data.",
    tags: ["CRM", "Sales", "Data"],
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    desc: "Strategy that uses multiple channels to attract, engage, and convert customers online.",
    tags: ["SEO", "SEM", "Social"],
  },
];

const INDUSTRIES = [
  { icon: Cpu,            title: "Technology",          desc: "Next-gen software & IT solutions" },
  { icon: ShoppingCart,   title: "Ecommerce",           desc: "Dynamic retail & digital storefronts" },
  { icon: Landmark,       title: "Fintech & Banking",   desc: "Secure financial & payment platforms" },
  { icon: HeartPulse,     title: "Healthcare",          desc: "Modern medical & patient portals" },
  { icon: Truck,          title: "Logistics & Shipping",desc: "Smart supply chain & fleet systems" },
  { icon: HomeIcon,       title: "Real Estate / PropTech", desc: "Smart property & brokerage tech" },
  { icon: Bot,            title: "AI & Machine Learning", desc: "Predictive analytics & neural networks" },
  { icon: Plane,          title: "Travel",              desc: "Seamless booking & trip planning" },
  { icon: GraduationCap,  title: "Education",           desc: "Interactive e-learning environments" },
  { icon: Factory,        title: "Manufacturing",       desc: "Automated production & ERP systems" },
];

const PROCESS = [
  { n: "01", icon: Send,          title: "Submit Project",    desc: "Tell us about scope and timeline — no login or file upload required." },
  { n: "02", icon: MessageSquare, title: "Discovery Call",    desc: "Within 48h we schedule a call to align on milestones, deliverables, and success metrics." },
  { n: "03", icon: GitBranch,     title: "Build Sprint",      desc: "Two-week sprints with weekly demos. You watch your product come alive in real time." },
  { n: "04", icon: Rocket,        title: "Launch & Support",  desc: "We ship to production, hand over docs, and stay on retainer for iteration sprints." },
];

const TECH = [
  "Python", "Java", "JavaScript", "Vue.js", "AngularJS", "React",
  "Solidity", "PHP", "React Native", "CSS", "Node.js", "Swift",
  "HTML", "Golang", "Kotlin",
];

const TECH_AI = [
  "Artificial Intelligence", "Machine Learning", "Deep Learning",
  "NLP", "Computer Vision", "Generative AI",
  "Big Data Analytics", "Cognitive Automation", "Robotics & RPA", "Predictive Modeling",
];

const TESTIMONIALS = [
  {
    quote: "The Shield took our Figma mess and shipped a polished React app in 5 weeks. The dashboard alone saved my team 12 hours a week.",
    name: "Sara Al-Mansoori",
    role: "CEO, Layla Cosmetics",
    initial: "S",
    variant: "mint" as const,
  },
  {
    quote: "The role-based admin panel is exactly what we needed. Superadmin can edit copy live, my ops team manages submissions — perfect.",
    name: "Daniel Okafor",
    role: "COO, FleetIQ",
    initial: "D",
    variant: "violet" as const,
  },
  {
    quote: "Submission was friction-free — one quick form and we got a clear scope back within 48 hours. The whole process felt senior.",
    name: "Mei Tanaka",
    role: "Founder, Studio Mei",
    initial: "M",
    variant: "purple" as const,
  },
];

const STATUS_FLOW = [
  { label: "Pending",      icon: Clock,         className: "badge-pending" },
  { label: "In Progress",  icon: Loader2,       className: "badge-progress" },
  { label: "Under Review", icon: Search,        className: "badge-review" },
  { label: "Completed",    icon: CheckCircle2,  className: "badge-completed" },
];

const DELIVERY_DATA = [38, 42, 35, 50, 45, 58, 52, 65, 60, 72, 68, 80];

const HERO_SLIDES = [
  "Application Development",
  "Graphic Design",
  "Software Development",
  "Mobile App Development",
  "Website Development",
  "UI / UX Designing",
  "Digital Marketing",
  "AI & Machine Learning",
];

export default function HomeView() {
  const { isAuthenticated, isAdmin, setView } = useAuth();
  const [slideIdx, setSlideIdx] = useState(0);
  const [showcase, setShowcase] = useState<ShowcaseProject[]>([]);

  useEffect(() => {
    setShowcase(loadShowcase());
    // Make sure the admin inbox has at least a few demo rows on first visit
    seedDemoSubmissions();
    // Live-refresh showcase when superadmin edits project cards in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theshield_showcase") setShowcase(loadShowcase());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % HERO_SLIDES.length);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* ─────────── HERO ─────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pt-12 pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-mint-300/30 bg-mint-300/5 px-4 py-1.5 text-xs font-medium text-mint-300 animate-fade-up stagger-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-300" />
              </span>
              Bridging the gap between business and technology
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl animate-fade-up stagger-2">
              <span className="block">We craft</span>
              <span className="relative block min-h-[1.1em] overflow-hidden">
                {HERO_SLIDES.map((slide, i) => (
                  <span
                    key={slide}
                    aria-hidden={i !== slideIdx}
                    className={`text-gradient-animated text-shadow-glow absolute inset-0 transition-all duration-700 ${
                      i === slideIdx
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4 pointer-events-none"
                    }`}
                  >
                    {slide}
                  </span>
                ))}
                {/* Spacer to size the rotating slot to the tallest slide */}
                <span className="text-gradient-animated text-shadow-glow opacity-0">
                  {HERO_SLIDES.reduce((a, b) => (a.length > b.length ? a : b), "")}
                </span>
              </span>
            </h1>

            {/* Slide indicators */}
            <div className="mt-4 flex flex-wrap gap-1.5 animate-fade-up stagger-3">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Show ${s}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slideIdx
                      ? "w-8 bg-mint-300"
                      : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300 animate-fade-up stagger-3">
              We provide full-cycle software development services encompassing planning,
              requirements definition, design and prototyping, software development,
              testing, deployment, and application maintenance.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up stagger-4">
              <a href="#submit" className="btn-primary">
                <Send className="h-4 w-4" /> Submit a Project
              </a>
              <a href="#services" className="btn-ghost">
                <Sparkles className="h-4 w-4" /> Know More
              </a>
              {isAuthenticated && isAdmin && (
                <button onClick={() => setView("dashboard")} className="btn-ghost">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 animate-fade-in">
              <Cloud className="h-4 w-4" />
              Preview mode — Firebase creds will be added later. Use Login → Demo Mode to explore the dashboard.
            </div>
          </div>

          {/* Floating preview card — dashboard-style with gauges + charts */}
          <div className="lg:col-span-5">
            <div className="relative animate-scale-in stagger-3">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-mint-300/20 via-violet-600/15 to-violet-500/10 blur-2xl animate-pulse-glow" />
              <div className="relative glass-card border-gradient overflow-hidden p-1">
                {/* Window chrome */}
                <div className="rounded-t-[15px] border-b border-white/5 bg-navy-900/60 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                      <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="font-mono text-[10px] text-ink-500">theshield.app/dashboard</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="bg-navy-900/40 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">Project status</div>
                      <div className="text-sm font-semibold text-white">Live overview</div>
                    </div>
                    <span className="badge badge-progress">
                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-mint-300" />
                      Active
                    </span>
                  </div>

                  {/* Stat tiles */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { l: "Active",   v: "12", c: "text-mint-300" },
                      { l: "Pending",  v: "4",  c: "text-amber-300" },
                      { l: "Shipped",  v: "38", c: "text-emerald-300" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                      >
                        <div className="text-[9px] uppercase tracking-wider text-ink-500">{s.l}</div>
                        <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gauge + chart */}
                  <div className="mt-4 flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <CircularGauge
                      value={78}
                      size={96}
                      stroke={9}
                      sublabel="on time"
                    />
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">
                        Delivery trend
                      </div>
                      <div className="mt-1 text-xl font-bold text-white">
                        94<span className="text-xs font-normal text-ink-400">% on-time</span>
                      </div>
                      <MiniAreaChart
                        data={DELIVERY_DATA}
                        width={180}
                        height={44}
                        stroke="#64ffda"
                        fillFrom="rgba(100, 255, 218, 0.35)"
                        fillTo="rgba(100, 255, 218, 0)"
                        showDot={false}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Status flow */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {STATUS_FLOW.map((s, i) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 animate-fade-up"
                        style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                      >
                        <div className="flex items-center gap-2">
                          <s.icon
                            className={`h-3.5 w-3.5 ${i === 1 ? "animate-spin-fast" : ""} text-ink-400`}
                          />
                          <span className="text-xs text-ink-200">{s.label}</span>
                        </div>
                        <span className={s.className}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── MARQUEE ─────────── */}
      <section className="border-y border-white/5 bg-white/[0.015] py-6 overflow-hidden">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
          {[...TECH, ...TECH].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-sm font-medium text-ink-400">
              <span className="h-1 w-1 rounded-full bg-mint-300/60" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ─────────── ACHIEVEMENTS / STATS ─────────── */}
      <section className="border-b border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-mint-300">
              Our Milestones
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Achievements
            </h2>
            <p className="mt-2 text-sm text-ink-400">
              Powering digital growth with innovation and trust
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="glass-card-hover p-5 animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gradient-animated sm:text-4xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-ink-400">{s.label}</div>
                  </div>
                  <Sparkline data={s.spark} color={s.color} width={64} height={24} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── SERVICES ─────────── */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-mint-300">
            Our Services
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Transforming ideas into powerful digital solutions
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">
            Bridging the gap between business and technology — across every technology domain.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="glass-card-hover group p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300/20 to-violet-600/15 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110">
                <s.icon className="h-6 w-6 text-mint-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{s.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── INDUSTRIES ─────────── */}
      <section id="industries" className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-16 scroll-mt-20">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
              What We Serve
            </span>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Industries</h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-300">
              Domain expertise across the verticals that move the modern economy.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {INDUSTRIES.map((it, i) => (
              <div
                key={it.title}
                className="glass-card-hover group p-5 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110">
                  <it.icon className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-sm font-semibold text-white">{it.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PROCESS ─────────── */}
      <section id="process" className="relative mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            How we work
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
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
              <div className="absolute -top-4 left-6 text-5xl font-bold text-white/10">
                {p.n}
              </div>
              <div className="relative">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300/20 to-violet-600/15 ring-1 ring-white/10">
                  <p.icon className="h-5 w-5 text-mint-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{p.desc}</p>
              </div>
              {i < PROCESS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink-600 lg:block">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── TECH STACK ─────────── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-400">
              Where Code Meets Intelligence
            </span>
            <h3 className="mt-2 text-2xl font-bold text-white">Our Technology Stack</h3>
            <p className="mt-2 text-sm text-ink-400">
              Building powerful digital products with cutting-edge technologies
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TECH.map((t, i) => (
              <span
                key={t}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-ink-200 transition-all duration-300 hover:border-mint-300/40 hover:bg-mint-300/5 hover:text-white animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-violet-500/20 bg-violet-600/[0.04] p-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Bot className="h-3.5 w-3.5" /> AI &amp; Data Technologies — Next-Gen Intelligent Tech
            </div>
            <div className="flex flex-wrap gap-2">
              {TECH_AI.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-white/5 px-3 py-1 text-xs font-medium text-ink-200 hover:bg-violet-600/15 hover:text-white transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── TESTIMONIALS ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-mint-300">
            Client love
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            What founders say about The Shield
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="glass-card-hover p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Quote className="h-7 w-7 text-mint-300/60" />
              <p className="mt-3 text-sm leading-relaxed text-ink-200">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/10"
                  style={{
                    background:
                      t.variant === "mint"
                        ? "linear-gradient(135deg, rgba(100, 255, 218, 0.30), rgba(102, 126, 234, 0.15))"
                        : t.variant === "violet"
                          ? "linear-gradient(135deg, rgba(102, 126, 234, 0.30), rgba(118, 75, 162, 0.15))"
                          : "linear-gradient(135deg, rgba(155, 126, 234, 0.30), rgba(118, 75, 162, 0.10))",
                  }}
                >
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

      {/* ─────────── SHOWCASE / OUR PROJECTS ─────────── */}
      <ShowcaseSection projects={showcase} />

      {/* ─────────── SUBMIT (now functional) ─────────── */}
      <SubmitProjectSection />

      {/* ─────────── TRACK ─────────── */}
      <TrackStatusSection />

      {/* ─────────── CTA ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-800 via-navy-900 to-ink-950 p-10 sm:p-14">
          <div className="absolute inset-0 -z-10 grid-backdrop opacity-60" />
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Got a project in mind?
              </h2>
              <p className="mt-2 max-w-xl text-ink-300">
                Tell us what you&apos;re building. We&apos;ll reply within 48 hours with a scope, timeline, and transparent quote.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="#submit" className="btn-primary">
                <Send className="h-4 w-4" /> Submit Project
              </a>
              <a href="mailto:akashperera464@gmail.com" className="btn-ghost">
                <Mail className="h-4 w-4" /> Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="border-t border-white/5 bg-navy-950/40 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_URL}
                  alt="The Shield logo"
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/15"
                />
                <span className="text-lg font-semibold text-white">
                  The <span className="text-gradient-animated">Shield</span>
                </span>
              </div>
              <p className="mt-3 max-w-sm text-sm text-ink-400">
                Bridging the gap between business and technology. We design, build,
                and ship production software across every technology domain.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> 15+ service locations
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> akashperera464@gmail.com
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> 0741622795
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-ink-400">
                <li><a href="#services" className="hover:text-white">Services</a></li>
                <li><a href="#industries" className="hover:text-white">Industries</a></li>
                <li><a href="#process" className="hover:text-white">Process</a></li>
                <li><a href="#submit" className="hover:text-white">Submit Project</a></li>
                <li><a href="#track" className="hover:text-white">Track Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Stack</h4>
              <ul className="mt-3 space-y-2 text-sm text-ink-400">
                <li>React + Next.js</li>
                <li>Python · Node.js · Java</li>
                <li>AI / ML / Data</li>
                <li>Mobile · Web · Cloud</li>
              </ul>
            </div>
          </div>

          {/* Aligned bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
            <span className="text-sm text-ink-400">
              © {new Date().getFullYear()} The Shield. All rights reserved.
            </span>
            <span className="flex items-center gap-2 text-sm text-ink-500">
              <Sparkles className="h-4 w-4 text-mint-300" /> Built with Next.js + Tailwind + Firebase
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* SHOWCASE / OUR PROJECTS — public portfolio cards                      */
/* ─────────────────────────────────────────────────────────────────────── */

function ShowcaseSection({ projects }: { projects: ShowcaseProject[] }) {
  const sorted = [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.order - b.order;
  });

  if (sorted.length === 0) return null;

  return (
    <section id="projects" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-mint-300/10 px-3 py-1 text-xs font-medium text-mint-300">
          <FolderKanban className="h-3.5 w-3.5" /> Our Projects
        </span>
        <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
          Work we&apos;re proud of
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-300">
          A snapshot of recent products we&apos;ve shipped for clients across web, mobile, design, and software. Click any card to view the live project.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p, i) => (
          <ShowcaseCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseCard({ project, index }: { project: ShowcaseProject; index: number }) {
  const hasUrl = /^https?:\/\/.+/.test(project.projectUrl || "");
  const hasImg = /^https?:\/\/.+/.test(project.imageUrl || "");

  const CardInner = (
    <>
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-navy-800">
        {hasImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-ink-600" />
          </div>
        )}
        {/* Top gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />

        {/* Category chip */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-950/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-mint-300 ring-1 ring-white/10 backdrop-blur">
            {project.category}
          </span>
        </div>

        {/* Featured star */}
        {project.featured && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/30 backdrop-blur">
              <Star className="h-3 w-3" /> Featured
            </span>
          </div>
        )}

        {/* External link hint */}
        {hasUrl && (
          <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-mint-300/90 text-navy-950 opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug text-white group-hover:text-mint-200 transition-colors">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-300">
          {project.description}
        </p>
        {project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-ink-400 ring-1 ring-white/5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {hasUrl && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-mint-300">
            <ExternalLink className="h-3.5 w-3.5" /> View project
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className="group animate-fade-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {hasUrl ? (
        <a
          href={project.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-mint-300/40 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-mint-300/5"
        >
          {CardInner}
        </a>
      ) : (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
          {CardInner}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function SubmitProjectSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    timeline: "",
    brief: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.brief.trim()) {
      setError("Name, email, and project brief are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const submission: Submission = {
        id: "s_" + Math.random().toString(36).slice(2, 10),
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        service: form.service,
        timeline: form.timeline || undefined,
        brief: form.brief,
        attachments: uploads.map((u) => ({ name: u.name, url: u.url, size: u.size, type: u.type })),
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      addSubmission(submission);

      await new Promise((r) => setTimeout(r, 400));

      setSubmitting(false);
      setDone(true);
    } catch {
      setSubmitting(false);
      setError("Could not save submission locally. Please try again.");
    }
  };

  const reset = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      service: "",
      timeline: "",
      brief: "",
    });
    setUploads([]);
    setUploadProgress([]);
    setDone(false);
    setError(null);
  };

  if (done) {
    return (
      <section id="submit" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <div className="glass-card border-gradient overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="relative p-10 lg:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Submission received
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white">
                Thank you, {form.name.split(" ")[0] || "there"}!
              </h2>
              <p className="mt-3 text-ink-300">
                Your project brief has been saved. We&apos;ll review it and reply to
                <span className="font-mono text-mint-300"> {form.email} </span>
                within 48 hours with a clear scope and estimate.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-200">
                {[
                  "Reference ID: " + form.email.split("@")[0].slice(0, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
                  "Status: Pending review",
                  "Next step: Discovery call within 48h",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <button onClick={reset} className="btn-primary">
                  <Send className="h-4 w-4" /> Submit another
                </button>
                <a href="#track" className="btn-ghost">
                  <Search className="h-4 w-4" /> Track status
                </a>
              </div>
            </div>
            <div className="relative border-t border-white/5 bg-navy-900/40 p-10 lg:border-l lg:border-t-0 lg:p-12">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
                What you submitted
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow k="Name" v={form.name} />
                <SummaryRow k="Email" v={form.email} />
                {form.company && <SummaryRow k="Company" v={form.company} />}
                {form.service && <SummaryRow k="Service" v={form.service} />}
                {form.timeline && <SummaryRow k="Timeline" v={form.timeline} />}
                {uploads.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-500">
                      Attachments ({uploads.length})
                    </dt>
                    <dd className="mt-2 space-y-1.5">
                      {uploads.map((f) => (
                        <a
                          key={f.url}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-ink-200 transition-colors hover:border-mint-300/40 hover:text-mint-200"
                        >
                          {f.type.startsWith("image/") ? (
                            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{f.name}</span>
                          <span className="ml-auto shrink-0 text-ink-500">{formatBytes(f.size)}</span>
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-500">Brief</dt>
                  <dd className="mt-1 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-ink-200">
                    {form.brief}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
      <div className="glass-card border-gradient overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="relative p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint-300/10 px-3 py-1 text-xs font-medium text-mint-300">
              <Rocket className="h-3.5 w-3.5" /> Submit Project
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white">Tell us about your project</h2>
            <p className="mt-3 text-ink-300">
              Fill in the form — no login, no file uploads. Share scope and
              timeline and we&apos;ll reply within 48 hours with a clear estimate.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-200">
              {[
                "No login required",
                "Saved locally for demo tracking",
                "Email-based status updates",
                "Share wireframes via email or Drive link",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative border-t border-white/5 bg-navy-900/40 p-10 lg:border-l lg:border-t-0 lg:p-12"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Your name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  className="input-field"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                    className="input-field"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Company
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    className="input-field"
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Service needed
                </label>
                <select
                  value={form.service}
                  onChange={(e) => update("service", e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a service…</option>
                  {SERVICES.map((s) => (
                    <option key={s.title} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Timeline
                </label>
                <input
                  value={form.timeline}
                  onChange={(e) => update("timeline", e.target.value)}
                  className="input-field"
                  placeholder="e.g. 6 weeks, Q3 2026, ASAP…"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Attachments {UPLOAD_CONFIGURED ? "(optional)" : "(disabled — ask admin to configure uploads)"}
                </label>
                <FileDropzone
                  uploads={uploads}
                  progress={uploadProgress}
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                  onAddFiles={async (files) => {
                    if (!UPLOAD_CONFIGURED) {
                      setError("File uploads are not configured yet. Please email files directly.");
                      return;
                    }
                    setError(null);
                    const list = Array.from(files);
                    if (uploads.length + list.length > MAX_FILES) {
                      setError(`Max ${MAX_FILES} files per submission.`);
                      return;
                    }
                    for (const file of list) {
                      const v = validateFile(file);
                      if (v) {
                        setError(v);
                        continue;
                      }
                      setUploadProgress((p) => [
                        ...p,
                        { fileName: file.name, progress: 0, status: "uploading" },
                      ]);
                      try {
                        const result = await uploadFile(file, (prog) => {
                          setUploadProgress((p) =>
                            p.map((it) =>
                              it.fileName === file.name ? prog : it
                            )
                          );
                        });
                        setUploads((u) => [...u, result]);
                      } catch {
                        // error already reflected in progress entry
                      }
                    }
                    // Clear out errored entries after a beat
                    setTimeout(() => {
                      setUploadProgress((p) => p.filter((it) => it.status === "uploading"));
                    }, 1500);
                  }}
                  onRemove={(idx) => {
                    setUploads((u) => u.filter((_, i) => i !== idx));
                  }}
                />
                <p className="mt-1 text-[10px] text-ink-500">
                  PNG, JPG, GIF, WebP, PDF, ZIP, DOC, DOCX — up to 25 MB each, max {MAX_FILES} files.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Project brief *
                </label>
                <textarea
                  rows={4}
                  value={form.brief}
                  onChange={(e) => update("brief", e.target.value)}
                  required
                  className="input-field resize-none"
                  placeholder="What are you building? Any must-haves, links, or context we should know?"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploadProgress.some((p) => p.status === "uploading")}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/40 border-t-white" />
                    Submitting…
                  </>
                ) : uploadProgress.some((p) => p.status === "uploading") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading files…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit project
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-ink-500">
                Submissions are saved locally for demo tracking. Firestore wiring lands next.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
      <dt className="text-xs uppercase tracking-wider text-ink-500">{k}</dt>
      <dd className="truncate text-right text-ink-200">{v}</dd>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* FILE DROPZONE — drag/drop or click to upload, with per-file progress    */
/* ─────────────────────────────────────────────────────────────────────── */

function FileDropzone({
  uploads,
  progress,
  dragOver,
  setDragOver,
  onAddFiles,
  onRemove,
}: {
  uploads: UploadedFile[];
  progress: UploadProgress[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) onAddFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? "border-mint-300 bg-mint-300/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
        }`}
      >
        <Paperclip className="h-5 w-5 text-ink-400" />
        <p className="mt-2 text-xs text-ink-300">
          <span className="font-semibold text-mint-300">Click to attach</span> or drag & drop
        </p>
        <p className="mt-0.5 text-[10px] text-ink-500">Files are uploaded securely</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.zip,.doc,.docx"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Active upload progress */}
      {progress.length > 0 && (
        <div className="space-y-1.5">
          {progress.map((p, i) => (
            <div
              key={p.fileName + i}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate text-ink-200">{p.fileName}</span>
                <span
                  className={`ml-2 shrink-0 ${
                    p.status === "error"
                      ? "text-rose-300"
                      : p.status === "done"
                      ? "text-emerald-300"
                      : "text-ink-400"
                  }`}
                >
                  {p.status === "error"
                    ? "Failed"
                    : p.status === "done"
                    ? "Done"
                    : `${p.progress}%`}
                </span>
              </div>
              {p.status === "uploading" && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-mint-300 transition-all duration-200"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              )}
              {p.status === "error" && (
                <p className="mt-1 text-[10px] text-rose-300">{p.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Already-uploaded files */}
      {uploads.length > 0 && (
        <div className="space-y-1.5">
          {uploads.map((f, i) => (
            <div
              key={f.url}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
            >
              {f.type.startsWith("image/") ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-mint-300" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-mint-300" />
              )}
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-ink-200 hover:text-mint-200"
              >
                {f.name}
              </a>
              <span className="ml-auto shrink-0 text-ink-500">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="text-ink-500 hover:text-rose-300"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* FUNCTIONAL TRACK STATUS SECTION                                         */
/* ─────────────────────────────────────────────────────────────────────── */

function TrackStatusSection() {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; projectTitle: string; status: string; createdAt: string }>
  >([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      setResults([]);
      setSearched(false);
      return;
    }
    try {
      const all = loadSubmissions();
      const matches = all.filter(
        (s) => s.email.toLowerCase() === email.toLowerCase()
      );
      setResults(
        matches.map((s) => ({
          id: s.id,
          projectTitle: s.service || s.brief?.slice(0, 60) || "Project",
          status: s.status,
          createdAt: s.createdAt,
        }))
      );
      setSearched(true);
    } catch {
      setError("Could not read saved submissions.");
    }
  };

  return (
    <section id="track" className="mx-auto max-w-4xl px-6 py-20 scroll-mt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-300">
          <Search className="h-3.5 w-3.5" /> Track Status
        </span>
        <h2 className="mt-4 text-3xl font-bold text-white">Track your submission</h2>
        <p className="mt-3 text-ink-300">
          Enter the email you used to submit — we&apos;ll show every project and its live status.
        </p>
      </div>
      <form onSubmit={handleSearch} className="mt-8 glass-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
        {error && (
          <p className="mt-3 text-center text-xs text-rose-300">{error}</p>
        )}
        {searched && !error && (
          <div className="mt-6">
            {results.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-ink-400">
                No submissions found for <span className="font-mono text-ink-200">{email}</span>.
                <br />
                Try submitting a project above first.
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  {results.length} submission{results.length === 1 ? "" : "s"} found
                </h3>
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{r.projectTitle}</div>
                      <div className="font-mono text-[10px] text-ink-500">{r.id}</div>
                    </div>
                    <span className="badge badge-pending whitespace-nowrap">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
