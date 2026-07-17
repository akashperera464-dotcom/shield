# DevForge — Software Development Agency Web App

A professional React + Vite + Tailwind + Firebase + Cloudinary web application
for a software development agency. Clients submit projects, admins manage
submissions, superadmins manage site content & team roles.

> **Status:** Step 1 (Firebase config) + Step 2 (Auth context) are complete
> and the project builds + boots cleanly. Steps 3–6 will wire up the public
> portfolio form, status tracker, admin dashboard, and superadmin CMS panels.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | React 18 + Vite 5                        |
| Language       | JavaScript (JSX)                         |
| Styling        | Tailwind CSS 3 + custom animations       |
| Auth + DB      | Firebase Auth + Cloud Firestore          |
| Media storage  | Cloudinary (direct unsigned uploads)     |
| Hosting target | Static — `dist/` folder (Vercel/Netlify) |

## Quick start

```bash
npm install
cp .env.example .env       # then fill in your Firebase + Cloudinary keys
npm run dev                # http://localhost:5173
npm run build              # outputs to ./dist
```

## What's wired up so far

### Step 1 — `src/firebase/config.js`
- Reads all credentials from `VITE_FIREBASE_*` env vars.
- Initializes a singleton Firebase app, exports `auth`, `db`, `isFirebaseReady`.
- Fails gracefully (preview mode) when env vars are missing — the dev server
  still boots so the UI can be designed in parallel.
- Sets `browserLocalPersistence` so refreshes keep the admin logged in.

### Step 2 — `src/context/AuthContext.jsx`
- `<AuthProvider>` wraps the app; `useAuth()` hook exposes state + actions.
- Subscribes to `onAuthStateChanged` — single source of truth.
- On login, fetches the matching `users/uid` document to read the role.
- Exposes: `login`, `logout`, `refreshRole`, `registerAdmin`, `sendPasswordReset`.
- Derived flags: `isAuthenticated`, `isSuperadmin`, `isAdmin`.

### Plus (so the app runs end-to-end)
- `ProtectedRoute` — role-aware guard (handles unauthenticated / no-role / forbidden).
- `Navbar` with animated logo, mobile menu, role-aware links.
- `Home` — animated hero, stats, features, anchors for submit/track sections.
- `Login` — working auth form (will activate once Firebase creds are added).
- `Dashboard` — admin shell with metrics + empty state.
- `SuperAdmin` — tabbed console (CMS / Team / Media) with working `registerAdmin`.

## Firestore collections

```
users/{uid}           { name, email, role: 'superadmin'|'admin' }
siteContent/globalConfig  { heroTitle, heroSubtitle, mainBgUrl, aboutText, logoUrl, contactEmail }
projects/{autoId}     { clientName, clientEmail, projectTitle, description,
                        budget, attachments[], status, notes[], createdAt }
```

## Roles

| Role        | Sees                                                            |
| ----------- | --------------------------------------------------------------- |
| (public)    | `/`, project submission, status tracker                         |
| `admin`     | `/dashboard` (view submissions, update status, add notes)       |
| `superadmin`| everything admins see + `/superadmin` (CMS, team manager)       |

## Logo

Embedded via Cloudinary URL provided by the superadmin
(`src/components/Logo.jsx`).

## Next steps (Step 3 onwards)

- Step 3 — Public portfolio: dynamic fetch of `siteContent/globalConfig`,
  multi-step submission form with Cloudinary direct upload.
- Step 4 — Real-time status tracker (search by clientEmail).
- Step 5 — Admin dashboard: live `projects` grid, detail drawer, notes array.
- Step 6 — Superadmin CMS write-back + Cloudinary upload handler.
