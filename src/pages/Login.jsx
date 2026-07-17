/**
 * Login — Auth Portal (placeholder for full Step 5 wiring).
 *
 * Uses AuthContext.login() which wraps signInWithEmailAndPassword.
 * On success → redirect to /dashboard (admin) or /superadmin (superadmin).
 */
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isFirebaseReady } from '../firebase/config'
import Logo from '../components/Logo'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const profile = await login(email.trim(), password)
      if (profile?.role === 'superadmin') navigate('/superadmin')
      else if (profile?.role === 'admin') navigate('/dashboard')
      else navigate('/dashboard') // role-less users hit the ProtectedRoute guard
    } catch (e) {
      setErr(e?.message?.replace('Firebase:', '').trim() || 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-6 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-ink-900/40 backdrop-blur-xl lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between p-12 lg:flex">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900/40 via-ink-900 to-accent-900/30" />
          <div className="absolute inset-0 -z-10 grid-backdrop opacity-60" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <div>
            <Logo size={56} />
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white">
              Admin Portal
            </h1>
            <p className="mt-3 max-w-sm text-ink-300">
              Sign in to manage project submissions, update statuses, and (for superadmins)
              edit the live site content.
            </p>
          </div>
          <div className="space-y-3 text-sm text-ink-300">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Firebase Auth · session-persisted
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Role-based route guards
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Audit-trail notes per project
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-12">
          <div className="mb-8 lg:hidden">
            <Logo size={48} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-400">Sign in with your agency email.</p>

          {!isFirebaseReady && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Firebase isn't configured yet. Add credentials to <code>.env</code> (see{' '}
                <code>.env.example</code>) to enable real authentication.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@devforge.agency"
                  className="input-field pl-10"
                  disabled={!isFirebaseReady}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field px-10"
                  disabled={!isFirebaseReady}
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

            {err && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button type="submit" disabled={busy || !isFirebaseReady} className="btn-primary w-full">
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            Need access? Ask the <span className="text-brand-300">Superadmin</span> to provision your account.
          </p>
        </div>
      </div>
    </div>
  )
}
