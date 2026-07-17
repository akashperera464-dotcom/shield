/**
 * ────────────────────────────────────────────────────────────────────────────
 *  STEP 1 · FIREBASE CONFIGURATION INITIALIZER
 *  File: src/firebase/config.js
 * ────────────────────────────────────────────────────────────────────────────
 *  Responsibilities:
 *    • Initialize a singleton Firebase App instance.
 *    • Export ready-to-use `auth` (Firebase Auth) and `db` (Cloud Firestore)
 *      objects that every other module in the app imports.
 *    • Read all credentials from Vite env variables (no hard-coded secrets).
 *    • Fail gracefully when credentials are missing — the dev server should
 *      still boot so the UI can be designed in parallel with Firebase setup.
 *
 *  Env vars consumed (see .env.example):
 *    VITE_FIREBASE_API_KEY
 *    VITE_FIREBASE_AUTH_DOMAIN
 *    VITE_FIREBASE_PROJECT_ID
 *    VITE_FIREBASE_STORAGE_BUCKET
 *    VITE_FIREBASE_MESSAGING_SENDER_ID
 *    VITE_FIREBASE_APP_ID
 *
 *  ⚠️  When you (Superadmin) receive your real Firebase project credentials,
 *      just drop them into a `.env` file at the project root — no code changes
 *      required.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ── 1. Pull credentials from the environment ────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ── 2. Validate presence (warn loudly in dev, never crash the boot) ─────────
const REQUIRED_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
]

const missingKeys = REQUIRED_KEYS.filter((k) => !firebaseConfig[k])
const isConfigured = missingKeys.length === 0

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    `%c[firebase/config.js] Missing Firebase credentials: ${missingKeys.join(', ')}\n` +
    `The app will boot in OFFLINE PREVIEW mode. Add real values to a .env file ` +
    `(see .env.example) to enable Auth + Firestore.`,
    'color:#f59e0b;font-weight:600;',
  )
}

// ── 3. Initialize the Firebase App (singleton-safe for HMR) ─────────────────
/**
 * `getApps()` returns the already-initialized apps. We only call
 * `initializeApp` once (Vite HMR can re-run module code, so this guard
 * prevents the "Firebase App named '[DEFAULT]' already exists" error).
 */
const app = isConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

// ── 4. Export Auth + Firestore (or null placeholders in preview mode) ────────
/**
 * `auth` — Firebase Authentication instance. Used by AuthContext for
 *           signInWithEmailAndPassword / signOut / onAuthStateChanged.
 *
 * `db`   — Cloud Firestore instance. Used by every page that reads/writes
 *           the `users`, `siteContent`, and `projects` collections.
 *
 * `isFirebaseReady` — boolean flag other modules can check before calling
 *                     Firebase APIs (useful for showing a "Connect Firebase"
 *                     banner in the UI).
 */
export const auth = app ? getAuth(app) : null
export const db   = app ? getFirestore(app) : null
export const isFirebaseReady = isConfigured

// Persist auth across browser sessions so a refresh keeps the admin logged in.
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[firebase/config.js] Auth persistence failed:', err?.message)
  })
}

// ── 5. Convenience re-exports (used by AuthContext & pages) ──────────────────
export { app }
export default app
