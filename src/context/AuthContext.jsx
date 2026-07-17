/**
 * ────────────────────────────────────────────────────────────────────────────
 *  STEP 2 · AUTHENTICATION CONTEXT PROVIDER
 *  File: src/context/AuthContext.jsx
 * ────────────────────────────────────────────────────────────────────────────
 *  Responsibilities:
 *    • Wrap the entire app in <AuthProvider> so any component can call
 *      useAuth() to read the current user, role, and loading state.
 *    • Subscribe to Firebase's onAuthStateChanged — the single source of
 *      truth for the logged-in session.
 *    • Whenever a Firebase user is detected, fetch the matching document in
 *      the `users` Firestore collection to determine role
 *      ('superadmin' | 'admin' | undefined).
 *    • Expose helpers:
 *        - login(email, password)   → signInWithEmailAndPassword
 *        - logout()                  → signOut
 *        - refreshRole()             → re-fetch the role document on demand
 *
 *  Role model:
 *    • 'superadmin' — full system control (CMS, team manager, analytics).
 *    • 'admin'      — view submissions, update status, add internal notes.
 *    • A Firebase user with NO document in `users/uid` is treated as
 *      unauthorised (logged in but no role) — they get redirected back to
 *      the login screen with a "Contact superadmin" message.
 *
 *  Safety:
 *    • If Firebase isn't configured yet (preview mode), the provider returns
 *      a stable "logged-out" state so the UI keeps rendering.
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db, isFirebaseReady } from '../firebase/config'

// ── Demo mode flag (persisted to localStorage so refresh keeps the session) ──
const DEMO_KEY = 'devforge:demo-session'
const loadDemo = () => {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
const saveDemo = (val) => {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(val)) } catch {}
}
const clearDemo = () => {
  try { localStorage.removeItem(DEMO_KEY) } catch {}
}

// ── Context shape ────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

/**
 * useAuth — the single hook every component uses to access auth state.
 * Throws if used outside <AuthProvider> to catch mistakes early.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be used inside an <AuthProvider> tree.')
  }
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)   // Firebase user object (or null)
  const [profile, setProfile]   = useState(null)   // { name, email, role } from `users/uid`
  const [role, setRole]         = useState(null)   // 'superadmin' | 'admin' | null
  const [loading, setLoading]   = useState(true)   // true until first auth check resolves
  const [error, setError]       = useState(null)
  const [isDemo, setIsDemo]     = useState(false)  // true when running in demo mode

  // Guard so we only attach onAuthStateChanged once.
  const attachedRef = useRef(false)

  // ── Helper: fetch the user's role document from Firestore ──────────────────
  const fetchProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser || !db) return null
    try {
      const ref = doc(db, 'users', firebaseUser.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        return {
          uid: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || '',
          email: data.email || firebaseUser.email || '',
          role: data.role || null,
        }
      }
      // No profile document → user exists in Auth but isn't authorised.
      return {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        role: null,
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err)
      return null
    }
  }, [])

  // ── Subscribe to Firebase Auth state changes ───────────────────────────────
  useEffect(() => {
    // First: try to restore a demo session (works even without Firebase).
    const restored = loadDemo()
    if (restored) {
      setIsDemo(true)
      setUser({ uid: 'demo-' + restored.role, email: restored.email, isDemo: true })
      setProfile({ uid: 'demo-' + restored.role, name: restored.name, email: restored.email, role: restored.role })
      setRole(restored.role)
      setLoading(false)
      return
    }

    // Preview mode (no Firebase credentials yet) — short-circuit cleanly.
    if (!isFirebaseReady || !auth) {
      setLoading(false)
      return
    }
    if (attachedRef.current) return
    attachedRef.current = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true)
        setError(null)
        if (firebaseUser) {
          setUser(firebaseUser)
          const p = await fetchProfile(firebaseUser)
          setProfile(p)
          setRole(p?.role || null)
        } else {
          setUser(null)
          setProfile(null)
          setRole(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('[AuthContext] onAuthStateChanged error:', err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [fetchProfile])

  // ── demoLogin(role?) → bypasses Firebase, sets a mock superadmin/admin ────
  /**
   * Used when Firebase isn't configured yet (or for quick previews).
   * Persists to localStorage so refreshes keep the demo session.
   */
  const demoLogin = useCallback((overrideRole = 'superadmin') => {
    const demoRole = overrideRole === 'admin' ? 'admin' : 'superadmin'
    const demoProfile = {
      name: demoRole === 'superadmin' ? 'Demo Superadmin' : 'Demo Admin',
      email: demoRole === 'superadmin' ? 'superadmin@demo.devforge' : 'admin@demo.devforge',
      role: demoRole,
    }
    saveDemo(demoProfile)
    setIsDemo(true)
    setUser({ uid: 'demo-' + demoRole, email: demoProfile.email, isDemo: true })
    setProfile({ uid: 'demo-' + demoRole, ...demoProfile })
    setRole(demoRole)
    return demoProfile
  }, [])

  // ── login(email, password) → wraps signInWithEmailAndPassword ──────────────
  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not configured yet.')
    setError(null)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const p = await fetchProfile(cred.user)
      setProfile(p)
      setRole(p?.role || null)
      return p
    } catch (err) {
      console.error('[AuthContext] login error:', err)
      setError(err)
      throw err
    }
  }, [fetchProfile])

  // ── logout() → wraps signOut (also clears demo session) ──────────────────────
  const logout = useCallback(async () => {
    // Always clear demo first (covers both modes).
    clearDemo()
    setIsDemo(false)
    if (auth && !isDemo) {
      try { await signOut(auth) } catch {}
    }
    setUser(null)
    setProfile(null)
    setRole(null)
  }, [isDemo])

  // ── refreshRole() → re-fetch the role doc (e.g. after superadmin updates it)
  const refreshRole = useCallback(async () => {
    if (!user) return
    const p = await fetchProfile(user)
    setProfile(p)
    setRole(p?.role || null)
    return p
  }, [user, fetchProfile])

  /**
   * registerAdmin({ email, password, name })
   * ──────────────────────────────────────────────────────────────────────────
   * Superadmin-only helper. Creates a new Firebase Auth user and immediately
   * writes their profile document to `users/uid` with role='admin'.
   *
   * ⚠️  In production you would normally do this via a Cloud Function with
   *     admin SDK so the caller doesn't need to sign out. For this project
   *     we use the client SDK approach as requested in the spec — the
   *     superadmin's session will temporarily switch to the new admin, then
   *     they can log back in. The ProtectedRoute + role guard will keep the
   *     new admin out of the Superadmin panels automatically.
   */
  const registerAdmin = useCallback(async ({ email, password, name }) => {
    if (!auth || !db) throw new Error('Firebase is not configured yet.')
    setError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const newUid = cred.user.uid
      const newProfile = {
        uid: newUid,
        name,
        email,
        role: 'admin',
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', newUid), newProfile)
      return newProfile
    } catch (err) {
      console.error('[AuthContext] registerAdmin error:', err)
      setError(err)
      throw err
    }
  }, [])

  // ── sendPasswordReset(email) → wraps Firebase reset email ───────────────────
  const sendPasswordReset = useCallback(async (email) => {
    if (!auth) throw new Error('Firebase Auth is not configured yet.')
    await sendPasswordResetEmail(auth, email)
  }, [])

  // ── Derived flags (handy for conditional rendering) ────────────────────────
  const isAuthenticated = !!user && !!role
  const isSuperadmin    = role === 'superadmin'
  const isAdmin         = role === 'admin' || role === 'superadmin'

  // ── Memoised context value (prevents needless re-renders) ──────────────────
  const value = useMemo(() => ({
    // state
    user,
    profile,
    role,
    loading,
    error,
    isDemo,
    // derived
    isAuthenticated,
    isSuperadmin,
    isAdmin,
    // actions
    login,
    logout,
    demoLogin,
    refreshRole,
    registerAdmin,
    sendPasswordReset,
  }), [
    user, profile, role, loading, error, isDemo,
    isAuthenticated, isSuperadmin, isAdmin,
    login, logout, demoLogin, refreshRole, registerAdmin, sendPasswordReset,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
