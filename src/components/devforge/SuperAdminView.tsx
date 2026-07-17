"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DEMO_CONFIG,
  DEMO_TEAM,
  type SiteConfig,
  type TeamMember,
} from "@/data/demo";
import { GradientAvatar, MiniAreaChart, CircularGauge } from "./Charts";

const SIDEBAR_NAV = [
  { id: "home",       label: "Back to site",    icon: HomeIcon },
  { id: "dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { id: "cms",        label: "CMS Settings",    icon: Settings },
  { id: "team",       label: "Team Admins",     icon: Users },
  { id: "analytics",  label: "Analytics",       icon: Activity },
  { id: "storage",    label: "Storage",         icon: HardDrive },
] as const;

type TabId = "cms" | "team" | "analytics" | "storage";

const STORAGE_DATA = [42, 38, 55, 48, 65, 58, 72, 68, 85, 78, 92, 96];
const TRAFFIC_DATA = [120, 145, 138, 168, 185, 172, 195, 210, 188, 232, 248, 268];

export default function SuperAdminView() {
  const { profile, isDemo, setView } = useAuth();
  const [tab, setTab] = useState<TabId>("cms");

  const handleNav = (id: string) => {
    if (id === "home") return setView("home");
    if (id === "dashboard") return setView("dashboard");
    setTab(id as TabId);
  };

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ─────────── SIDEBAR ─────────── */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
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
                <span>{isDemo ? "demo session" : "live"}</span>
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
                  (item.id === "team" && tab === "team") ||
                  (item.id === "analytics" && tab === "analytics") ||
                  (item.id === "storage" && tab === "storage");
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "team" && (
                      <span className="rounded-md bg-violet-600/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                        {DEMO_TEAM.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Storage tile */}
            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500">
                  <HardDrive className="h-3 w-3 text-mint-300" /> Storage used
                </div>
                <div className="mt-1 text-2xl font-bold text-white">
                  4.2<span className="text-sm font-normal text-ink-400"> / 10 GB</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-300 to-violet-600 transition-all duration-1000"
                    style={{ width: "42%" }}
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
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-300">
                <Shield className="h-3.5 w-3.5" /> Superadmin Console
                {isDemo && (
                  <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                    Demo
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Console <span className="text-gradient-animated">overview</span>
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                Signed in as <span className="font-mono text-mint-300">{profile?.email}</span>
              </p>
            </div>
            <button onClick={() => setView("dashboard")} className="btn-ghost text-sm">
              <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Team Members" value={DEMO_TEAM.length} icon={Users} color="#64ffda" />
            <StatTile label="CMS Drafts" value={3} icon={Settings} color="#667eea" />
            <StatTile label="Linked Images" value={2} icon={ImageIcon} color="#9d8df1" />
            <StatTile label="Site Uptime" value="99.9%" icon={Activity} color="#64ffda" />
          </div>

          {/* Content area */}
          <div className="mt-6">
            {tab === "cms" && <CMSPanel isDemo={isDemo} />}
            {tab === "team" && <TeamPanel isDemo={isDemo} />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "storage" && <StoragePanel />}
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
    <div className="glass-card-hover p-5 animate-fade-up">
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

function CMSPanel({ isDemo }: { isDemo: boolean }) {
  const [form, setForm] = useState<SiteConfig>(DEMO_CONFIG);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isValidUrl = (u: string) => /^https?:\/\/.+/.test(u);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSave} className="glass-card p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold text-white">Site content</h2>
        <p className="mt-1 text-sm text-ink-400">
          Edit the <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">siteContent/globalConfig</code> document.
          Changes go live instantly on the public site.
        </p>
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
            resulting <code className="rounded bg-white/5 px-1 py-0.5 text-ink-300">res.cloudinary.com/...</code> URL below.
            We do not host client uploads.
          </p>

          <UrlField
            label="Logo URL"
            value={form.logoUrl}
            onChange={(v) => setForm({ ...form, logoUrl: v })}
            placeholder="https://res.cloudinary.com/<cloud>/image/upload/.../logo.png"
            preview={isValidUrl(form.logoUrl) ? (
              <img src={form.logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover ring-1 ring-mint-300/30" />
            ) : null}
          />
          <UrlField
            label="Main Background URL"
            value={form.mainBgUrl}
            onChange={(v) => setForm({ ...form, mainBgUrl: v })}
            placeholder="https://res.cloudinary.com/<cloud>/image/upload/.../bg.jpg"
            preview={isValidUrl(form.mainBgUrl) ? (
              <img src={form.mainBgUrl} alt="bg" className="h-10 w-16 rounded-lg object-cover ring-1 ring-mint-300/30" />
            ) : null}
          />

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">
              <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save changes"}
            </button>
            {isDemo && (
              <span className="text-xs text-amber-300">Demo mode — changes are local only.</span>
            )}
          </div>
        </div>
      </form>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white">Live preview</h3>
        <p className="mt-1 text-xs text-ink-400">Read-only snapshot of current public site config.</p>
        <div className="mt-4 space-y-3 text-sm">
          <PreviewRow k="heroTitle" v={form.heroTitle.slice(0, 30) + (form.heroTitle.length > 30 ? "…" : "")} />
          <PreviewRow k="heroSubtitle" v={form.heroSubtitle.slice(0, 30) + (form.heroSubtitle.length > 30 ? "…" : "")} />
          <PreviewRow k="contactEmail" v={form.contactEmail} />
          <PreviewRow k="logoUrl" v={isValidUrl(form.logoUrl) ? "connected" : "empty"} />
          <PreviewRow k="mainBgUrl" v={isValidUrl(form.mainBgUrl) ? "connected" : "empty"} />
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">Logo preview</div>
          <div className="mt-2 flex items-center gap-3">
            {isValidUrl(form.logoUrl) ? (
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

function TeamPanel({ isDemo }: { isDemo: boolean }) {
  const { registerAdmin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [team, setTeam] = useState<TeamMember[]>(DEMO_TEAM);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (isDemo) {
        const newMember: TeamMember = {
          uid: "u_" + Math.random().toString(36).slice(2, 8),
          name,
          email,
          role: "admin",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setTeam([newMember, ...team]);
        setMsg({ type: "ok", text: `Admin added (demo): ${email}` });
        setName(""); setEmail(""); setPass("");
      } else if (registerAdmin) {
        const p = await registerAdmin({ name, email, password: pass });
        setMsg({ type: "ok", text: `Admin created: ${p.email}` });
        setName(""); setEmail(""); setPass("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create admin.";
      setMsg({ type: "err", text: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (uid: string) => {
    if (isDemo) setTeam(team.filter((m) => m.uid !== uid));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleCreate} className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white">Register new admin</h2>
        <p className="mt-1 text-sm text-ink-400">
          Creates a Firebase Auth user and writes a <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">users/uid</code> doc
          with role=<span className="text-mint-300">admin</span>.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Full name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field pl-10"
                placeholder="Jane Doe"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field pl-10"
                placeholder="jane@devforge.agency"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                minLength={8}
                className="input-field pl-10 pr-10"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
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
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/40 border-t-white" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> {isDemo ? "Add to demo roster" : "Create admin"}
              </>
            )}
          </button>
          {isDemo && (
            <p className="text-[11px] text-amber-300">
              Demo mode — new admins are added locally only. Step 6 wiring will write to Firestore + Firebase Auth.
            </p>
          )}
        </div>
      </form>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white">Team roster</h3>
        <p className="mt-1 text-xs text-ink-400">All documents in the <code>users</code> collection.</p>
        <div className="mt-4 space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {team.map((m) => (
            <div
              key={m.uid}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <GradientAvatar
                initial={m.name.charAt(0)}
                size={36}
                variant={m.role === "superadmin" ? "violet" : "mint"}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-white">{m.name}</div>
                <div className="truncate text-xs text-ink-400">{m.email}</div>
              </div>
              <span className={m.role === "superadmin" ? "badge badge-progress" : "badge badge-pending"}>
                {m.role}
              </span>
              {isDemo && m.role !== "superadmin" && (
                <button
                  onClick={() => handleRemove(m.uid)}
                  className="rounded-md p-1.5 text-ink-500 hover:bg-rose-500/10 hover:text-rose-300"
                  title="Remove (demo)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function AnalyticsPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
              <BarChart3 className="h-3.5 w-3.5 text-mint-300" /> Traffic (30d)
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              2,847
              <span className="ml-2 text-xs font-normal text-emerald-300">+12.4%</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <MiniAreaChart
            data={TRAFFIC_DATA}
            width={400}
            height={120}
            stroke="#64ffda"
            fillFrom="rgba(100, 255, 218, 0.30)"
            fillTo="rgba(100, 255, 218, 0)"
            strokeWidth={2}
          />
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Activity className="h-3.5 w-3.5 text-violet-300" /> Engagement
        </div>
        <div className="mt-4 flex items-center justify-around">
          <CircularGauge value={84} size={110} stroke={10} sublabel="satisfaction" gradientFrom="#64ffda" gradientTo="#26d0a8" />
          <CircularGauge value={67} size={110} stroke={10} sublabel="referral" gradientFrom="#667eea" gradientTo="#764ba2" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function StoragePanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass-card p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
              <HardDrive className="h-3.5 w-3.5 text-mint-300" /> Storage usage (12mo)
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              4.2 GB <span className="text-xs font-normal text-ink-400">of 10 GB</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <MiniAreaChart
            data={STORAGE_DATA}
            width={520}
            height={140}
            stroke="#667eea"
            fillFrom="rgba(102, 126, 234, 0.30)"
            fillTo="rgba(102, 126, 234, 0)"
            strokeWidth={2}
          />
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <Activity className="h-3.5 w-3.5 text-mint-300" /> Quota usage
        </div>
        <div className="mt-6 flex justify-center">
          <CircularGauge value={42} size={140} stroke={12} sublabel="used" />
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
