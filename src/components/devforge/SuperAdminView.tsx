"use client";

import React, { useState } from "react";
import {
  Shield,
  Settings,
  Users,
  Image as ImageIcon,
  Save,
  Plus,
  Mail,
  Lock,
  User,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CONFIG, DEMO_TEAM, type SiteConfig, type TeamMember } from "@/data/demo";

const TABS = [
  { id: "cms", label: "CMS Settings", icon: Settings },
  { id: "team", label: "Team Admins", icon: Users },
  { id: "media", label: "Media Upload", icon: ImageIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SuperAdminView() {
  const { profile, isDemo } = useAuth();
  const [tab, setTab] = useState<TabId>("cms");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10">
          <Shield className="h-6 w-6 text-brand-200" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Superadmin Console
            {isDemo && (
              <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-wider text-amber-300">
                · Demo
              </span>
            )}
          </h1>
          <p className="text-sm text-ink-400">
            Signed in as <span className="font-mono text-brand-300">{profile?.email}</span>
            {" · "}role <span className="font-mono text-brand-300">{profile?.role}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? "bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/30"
                : "text-ink-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "cms" && <CMSPanel isDemo={isDemo} />}
        {tab === "team" && <TeamPanel isDemo={isDemo} />}
        {tab === "media" && <MediaPanel isDemo={isDemo} />}
      </div>
    </div>
  );
}

function CMSPanel({ isDemo }: { isDemo: boolean }) {
  const [form, setForm] = useState<SiteConfig>(DEMO_CONFIG);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />
            <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
          </div>
          <Field label="Main BG URL" value={form.mainBgUrl} onChange={(v) => setForm({ ...form, mainBgUrl: v })} />
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
          <PreviewRow k="logoUrl" v="connected" />
          <PreviewRow k="mainBgUrl" v="connected" />
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">Logo preview</div>
          <div className="mt-2 flex items-center gap-3">
            <img src={form.logoUrl} alt="logo" className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10" />
            <div className="text-xs text-ink-400">Cloudinary-hosted</div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          with role=<span className="text-brand-300">admin</span>.
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
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/10 ${
                  m.role === "superadmin"
                    ? "bg-gradient-to-br from-brand-500/40 to-accent-500/30"
                    : "bg-gradient-to-br from-ink-500/40 to-ink-700/30"
                }`}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-white">{m.name}</div>
                <div className="truncate text-xs text-ink-400">{m.email}</div>
              </div>
              <span className={m.role === "superadmin" ? "badge-progress" : "badge-pending"}>
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

function MediaPanel({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white">Cloudinary media upload</h2>
      <p className="mt-1 text-sm text-ink-400">
        Direct unsigned uploads via browser fetch. Returned URLs are pasted into the CMS fields above.
      </p>
      <div className="mt-6 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-12 text-center transition-colors hover:border-brand-400/40">
        <ImageIcon className="mx-auto h-10 w-10 text-ink-400" />
        <p className="mt-2 text-sm text-ink-300">Drop an image to upload</p>
        <p className="text-xs text-ink-500">PNG, JPG, WebP — up to 25MB</p>
      </div>
      {isDemo && (
        <p className="mt-3 text-center text-xs text-amber-300">
          Demo mode — Cloudinary upload handler ships in Step 6. Add credentials to .env to enable real uploads.
        </p>
      )}
    </div>
  );
}

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

function PreviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="font-mono text-xs text-ink-400">{k}</span>
      <span className="truncate ml-3 text-right text-ink-200">{v}</span>
    </div>
  );
}
