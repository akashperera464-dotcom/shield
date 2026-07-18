"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png";

export default function LoginView() {
  const { login, setView } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const profile = await login(email.trim(), password);
      setView(profile.role === "superadmin" ? "superadmin" : "dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-6 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 backdrop-blur-xl lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between p-12 lg:flex">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-800 via-navy-900 to-ink-950" />
          <div className="absolute inset-0 -z-10 grid-backdrop opacity-60" />
          <div className="absolute -top-20 -left-20 -z-10 h-72 w-72 rounded-full bg-mint-300/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 -z-10 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
          <button
            onClick={() => setView("home")}
            className="inline-flex w-fit items-center gap-2 text-sm text-ink-300 hover:text-mint-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </button>
          <div>
            <img
              src={LOGO_URL}
              alt="The Shield"
              className="h-14 w-14 rounded-xl object-cover ring-1 ring-mint-300/30"
            />
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white">
              Admin <span className="text-gradient-animated">Portal</span>
            </h1>
            <p className="mt-3 max-w-sm text-ink-300">
              Sign in to manage project submissions, update statuses, and (for superadmins)
              edit the live site content.
            </p>
          </div>
          <div className="space-y-3 text-sm text-ink-300">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Secure session-persisted auth
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-300" /> Role-based route guards
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Audit-trail notes per project
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-12">
          <div className="mb-8 lg:hidden">
            <img
              src={LOGO_URL}
              alt="The Shield"
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-mint-300/30"
            />
          </div>
          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-400">Sign in with your agency email.</p>

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
                  placeholder="you@theshield.agency"
                  className="input-field pl-10"
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
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field px-10"
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

            <button type="submit" disabled={busy} className="btn-primary w-full">
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
            Need a real account? Ask the <span className="text-mint-300">Superadmin</span> to provision your access.
          </p>
        </div>
      </div>
    </div>
  );
}
