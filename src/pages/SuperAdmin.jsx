/**
 * SuperAdmin — CMS + Team Manager (placeholder for Step 6).
 *
 * In Step 6 this page will:
 *   • Edit `siteContent/globalConfig` (heroTitle, heroSubtitle, mainBgUrl, etc.).
 *   • Upload new logo / hero images to Cloudinary directly from the browser.
 *   • Register new admins (AuthContext.registerAdmin) and manage team roles.
 *
 * For now it shows the superadmin identity + skeleton panels.
 */
import React, { useState } from 'react'
import {
  Shield, Settings, Users, Image as ImageIcon, Save, Plus, Mail, Lock, User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isFirebaseReady } from '../firebase/config'

const TABS = [
  { id: 'cms',   label: 'CMS Settings',    icon: Settings  },
  { id: 'team',  label: 'Team Admins',     icon: Users     },
  { id: 'media', label: 'Media Upload',    icon: ImageIcon },
]

export default function SuperAdmin() {
  const { profile, registerAdmin } = useAuth()
  const [tab, setTab] = useState('cms')

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10">
          <Shield className="h-6 w-6 text-brand-200" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Superadmin Console
          </h1>
          <p className="text-sm text-ink-400">
            Signed in as <span className="font-mono text-brand-300">{profile?.email}</span>
            {' · '}role <span className="font-mono text-brand-300">{profile?.role}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? 'bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/30'
                : 'text-ink-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="mt-6">
        {tab === 'cms' && <CMSPanel />}
        {tab === 'team' && <TeamPanel registerAdmin={registerAdmin} />}
        {tab === 'media' && <MediaPanel />}
      </div>
    </div>
  )
}

function CMSPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="glass-card p-6 lg:col-span-2">
        <h2 className="font-display text-xl font-semibold text-white">Site content</h2>
        <p className="mt-1 text-sm text-ink-400">
          Edit the <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">siteContent/globalConfig</code> document.
          Changes go live instantly on the public site.
        </p>
        <div className="mt-6 space-y-4">
          <Field label="Hero Title"    placeholder="We build software that ships." />
          <Field label="Hero Subtitle" placeholder="Senior-only product studio. Ship in weeks, not months." />
          <Field label="About Text"    placeholder="A short paragraph about your agency…" textarea />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Email" placeholder="hello@devforge.agency" />
            <Field label="Logo URL"      placeholder="https://res.cloudinary.com/…" />
          </div>
          <Field label="Main BG URL" placeholder="https://res.cloudinary.com/…" />
          <button disabled className="btn-primary">
            <Save className="h-4 w-4" /> Save changes (Step 6 wiring)
          </button>
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-white">Live preview</h3>
        <p className="mt-1 text-xs text-ink-400">Read-only snapshot of current public site config.</p>
        <div className="mt-4 space-y-3 text-sm">
          <PreviewRow k="heroTitle"    v="—" />
          <PreviewRow k="heroSubtitle" v="—" />
          <PreviewRow k="contactEmail" v="—" />
          <PreviewRow k="logoUrl"      v="connected" />
        </div>
      </div>
    </div>
  )
}

function TeamPanel({ registerAdmin }) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const p = await registerAdmin({ name, email, password: pass })
      setMsg({ type: 'ok', text: `Admin created: ${p.email}` })
      setName(''); setEmail(''); setPass('')
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Failed to create admin.' })
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-semibold text-white">Register new admin</h2>
        <p className="mt-1 text-sm text-ink-400">
          Creates a Firebase Auth user and writes a <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">users/uid</code> doc
          with role=<span className="text-brand-300">admin</span>.
        </p>
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Full name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field pl-10" placeholder="Jane Doe" disabled={!isFirebaseReady} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-10" placeholder="jane@devforge.agency" disabled={!isFirebaseReady} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={8} className="input-field pl-10" placeholder="Min. 8 characters" disabled={!isFirebaseReady} />
            </div>
          </div>
          {msg && (
            <div className={`rounded-lg border p-3 text-xs ${msg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={busy || !isFirebaseReady} className="btn-primary">
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Create admin
              </>
            )}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-white">Team roster</h3>
        <p className="mt-1 text-xs text-ink-400">All documents in the <code>users</code> collection.</p>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 opacity-60">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-500/20 ring-1 ring-white/10" />
              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="mt-1.5 h-2 w-48 rounded bg-white/5" />
              </div>
              <span className="badge-pending">loading</span>
            </div>
          ))}
          <p className="pt-2 text-center text-xs text-ink-500">
            Live roster wiring lands in Step 6.
          </p>
        </div>
      </div>
    </div>
  )
}

function MediaPanel() {
  return (
    <div className="glass-card p-6">
      <h2 className="font-display text-xl font-semibold text-white">Cloudinary media upload</h2>
      <p className="mt-1 text-sm text-ink-400">
        Direct unsigned uploads via browser fetch. Returned URLs are pasted into the CMS fields above.
      </p>
      <div className="mt-6 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
        <ImageIcon className="mx-auto h-10 w-10 text-ink-400" />
        <p className="mt-2 text-sm text-ink-300">Drop an image to upload</p>
        <p className="text-xs text-ink-500">PNG, JPG, WebP — up to 25MB</p>
      </div>
      <p className="mt-3 text-center text-xs text-ink-500">
        Cloudinary upload handler ships in Step 6.
      </p>
    </div>
  )
}

function Field({ label, placeholder, textarea }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">{label}</label>
      {textarea ? (
        <textarea rows={3} placeholder={placeholder} disabled className="input-field resize-none" />
      ) : (
        <input placeholder={placeholder} disabled className="input-field" />
      )}
    </div>
  )
}

function PreviewRow({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="font-mono text-xs text-ink-400">{k}</span>
      <span className="text-ink-200">{v}</span>
    </div>
  )
}
