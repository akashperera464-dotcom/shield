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
  user: { uid: string; email: string; isDemo: boolean } | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
  isDemo: boolean;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  view: View;
  setView: (v: View) => void;
  login: (email: string, password: string) => Promise<Profile>;
  demoLogin: (role?: "superadmin" | "admin") => Profile;
  logout: () => Promise<void>;
  registerAdmin: (p: {
    name: string;
    email: string;
    password: string;
  }) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

const DEMO_KEY = "devforge:demo-session";

function loadDemo(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}
function saveDemo(p: Profile) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(p));
  } catch {}
}
function clearDemo() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazy-initialise from localStorage so we never call setState in an effect
  // (avoids the react-hooks/set-state-in-effect lint error and cascading renders).
  const [initialDemo] = useState<Profile | null>(() => loadDemo());

  const [user, setUser] = useState<AuthContextValue["user"]>(
    initialDemo
      ? { uid: initialDemo.uid, email: initialDemo.email, isDemo: true }
      : null
  );
  const [profile, setProfile] = useState<Profile | null>(initialDemo);
  const [role, setRole] = useState<Role>(initialDemo?.role ?? null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(!!initialDemo);
  const [view, setView] = useState<View>("home");

  // Keep loading false (no async work pending). Kept as a no-op effect so any
  // future async initialisation has a natural home.
  useEffect(() => {
    // no-op — initial state already restored lazily above
  }, []);

  const demoLogin = useCallback((override: "superadmin" | "admin" = "superadmin") => {
    const p: Profile = {
      uid: "demo-" + override,
      name: override === "superadmin" ? "Demo Superadmin" : "Demo Admin",
      email:
        override === "superadmin"
          ? "superadmin@demo.devforge"
          : "admin@demo.devforge",
      role: override,
    };
    saveDemo(p);
    setIsDemo(true);
    setUser({ uid: p.uid, email: p.email, isDemo: true });
    setProfile(p);
    setRole(p.role);
    return p;
  }, []);

  const login = useCallback(
    async (_email: string, _password: string) => demoLogin("superadmin"),
    [demoLogin]
  );

  const logout = useCallback(async () => {
    clearDemo();
    setIsDemo(false);
    setUser(null);
    setProfile(null);
    setRole(null);
    setView("home");
  }, []);

  const registerAdmin = useCallback(
    async ({ name, email }: { name: string; email: string; password: string }) => {
      const p: Profile = {
        uid: "demo-admin-" + Date.now(),
        name,
        email,
        role: "admin",
      };
      return p;
    },
    []
  );

  const isAuthenticated = !!user && !!role;
  const isSuperadmin = role === "superadmin";
  const isAdmin = role === "admin" || role === "superadmin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      isDemo,
      isAuthenticated,
      isSuperadmin,
      isAdmin,
      view,
      setView,
      login,
      demoLogin,
      logout,
      registerAdmin,
    }),
    [
      user, profile, role, loading, isDemo,
      isAuthenticated, isSuperadmin, isAdmin, view,
      login, demoLogin, logout, registerAdmin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
