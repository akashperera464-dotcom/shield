"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export type Role = "superadmin" | "admin" | null;
export type View = "home" | "login" | "dashboard" | "superadmin";

export interface Profile {
  uid: string;
  name: string;
  email: string;
  role: Exclude<Role, null>;
}

interface AuthContextValue {
  user: { uid: string; email: string } | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  view: View;
  setView: (v: View) => void;
  login: (email: string, password: string) => Promise<Profile>;
  logout: (everywhere?: boolean) => Promise<void>;
  registerAdmin: (p: {
    name: string;
    email: string;
    password: string;
    jobField?: string;
    mobile?: string;
    username?: string;
  }) => Promise<Profile>;
  resetPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("home");

  // ── On mount: validate existing session cookie via /api/auth/session ──
  // This is the cross-device login fix: the session lives in MongoDB with
  // an HttpOnly cookie. When you log in on phone, the cookie is set on the
  // phone. When you open the site on desktop, no cookie yet → not logged in.
  // BUT: once you log in on desktop too, BOTH sessions exist in MongoDB and
  // logout-everywhere kills them all.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const p = (await res.json()) as Profile;
          setProfile(p);
          setRole(p.role);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch {
        setProfile(null);
        setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Periodic session re-validation (every 60s) ──
  // Detects cross-device logout: if another tab/device logs you out, this
  // device will pick it up within 60s and bounce you to the homepage.
  // Also picks up role changes (superadmin demotes you).
  useEffect(() => {
    if (!profile) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          // Session invalidated elsewhere — log out locally
          setProfile(null);
          setRole(null);
          setView("home");
        } else {
          const p = (await res.json()) as Profile;
          // Only update if profile changed (avoid needless re-renders)
          setProfile((prev) =>
            prev?.uid === p.uid && prev?.role === p.role ? prev : p
          );
          setRole((prev) => (prev === p.role ? prev : p.role));
        }
      } catch {
        // Network hiccup — don't log out on transient failure
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  // ── login: POST credentials, server sets HttpOnly cookie ──
  const login = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error("Email and password are required.");
    }
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });
    } catch {
      throw new Error("Could not reach the login server. Check your connection and try again.");
    }
    const data = (await res.json().catch(() => null)) as
      | { error?: string }
      | Profile
      | null;
    if (!res.ok) {
      const msg =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "Invalid email or password.";
      throw new Error(msg);
    }
    const p = data as Profile;
    setProfile(p);
    setRole(p.role);
    return p;
  }, []);

  // ── logout: POST /api/auth/logout, optionally ?everywhere=true ──
  const logout = useCallback(async (everywhere = false) => {
    try {
      await fetch(
        `/api/auth/logout${everywhere ? "?everywhere=true" : ""}`,
        { method: "POST" }
      );
    } catch {
      // ignore — we'll clear local state anyway
    }
    setProfile(null);
    setRole(null);
    setView("home");
  }, []);

  // ── registerAdmin: superadmin-only, creates a new admin via API ──
  // Returns the new admin's Profile. Does NOT auto-log-in as the new admin.
  const registerAdmin = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      jobField?: string;
      mobile?: string;
      username?: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to register admin" }));
        throw new Error(err.error || "Failed to register admin");
      }
      const p = (await res.json()) as Profile;
      return p;
    },
    []
  );

  // ── resetPassword: request a password reset email ──
  // Without email service configured, returns a generic ok message.
  const resetPassword = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      return { ok: false, message: "Failed to request reset. Try again later." };
    }
    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      message: data.message || "If that email exists, a reset link has been sent.",
    };
  }, []);

  const user = profile
    ? { uid: profile.uid, email: profile.email }
    : null;
  const isAuthenticated = !!profile && !!role;
  const isSuperadmin = role === "superadmin";
  const isAdmin = role === "admin" || role === "superadmin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      isAuthenticated,
      isSuperadmin,
      isAdmin,
      view,
      setView,
      login,
      logout,
      registerAdmin,
      resetPassword,
    }),
    [
      user, profile, role, loading,
      isAuthenticated, isSuperadmin, isAdmin, view,
      login, logout, registerAdmin, resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
