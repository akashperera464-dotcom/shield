
---
Task ID: hero-slideshow+graphic-design+budget-removal+superadmin-creds
Agent: main (continuation)
Task: Add hero slideshow rotating through service topics, add Graphic Design service, remove Budget field from submit form, configure superadmin test credentials.

Work Log:
- Checked /home/z/my-project/upload/ — found 12 PNG/PDF images + 1 analysis JSON. Analysis describes a dark-premium dashboard layout (navy #1a1b2e, accent #00d4ff) — current palette already matches this style.
- HomeView.tsx: Added HERO_SLIDES constant with 8 topics (Application Development, Graphic Design, Software Development, Mobile App Development, Website Development, UI/UX Designing, Digital Marketing, AI & Machine Learning). Replaced static hero title with rotating slideshow (2.6s interval, fade+slide animation, clickable indicator dots).
- HomeView.tsx: Added Graphic Design as a new entry in SERVICES array (Palette icon, Branding/Logo/Visual Identity tags, brand-identity description).
- HomeView.tsx: Removed Budget field from SubmitProjectSection — removed from useState shape, reset(), success summary, form UI, and description copy ("Share scope and timeline"). Also removed "budget" mention from PROCESS step 01 description.
- HomeView.tsx: Added useEffect import (was only useState).
- AuthContext.tsx: Replaced the always-superadmin login() with credential-aware logic. Superadmin creds: akashperera@shield.com / akashperera123*#. Any other valid email/password → admin role. Empty creds → throw "Invalid email or password."
- LoginView.tsx: Replaced amber Firebase-not-configured banner with mint-colored banner showing the superadmin test credentials. Updated submit button text from "Sign in (any input works in preview)" to just "Sign in".
- Verified `npx tsc --noEmit` passes clean for the project source (only /examples/ and /skills/ have unrelated errors).

Stage Summary:
- Hero now rotates through 8 service topics with clickable indicators.
- Graphic Design appears in SERVICES grid between NetSuite Integration and Software Development.
- Budget field is fully removed from submit form, success summary, state, and copy.
- Superadmin login: akashperera@shield.com / akashperera123*# (any other email → admin).
- LoginView shows the test credentials in a mint banner above the form.
- TypeScript build clean; dev server healthy on :3000 and :81.

---
Task ID: cloudinary-client-uploads
Agent: main
Task: Add client-side file uploads to the Submit Project form using an unsigned upload preset. No mention of the vendor name anywhere in the UI.

Work Log:
- Created .env.local with NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhd06wdov and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=akash123.
- Created /home/z/my-project/src/lib/uploads.ts — pure helper module:
  * UPLOAD_CONFIGURED flag (true when both env vars are present)
  * MAX_FILE_SIZE = 25 MB, MAX_FILES = 5, ALLOWED_TYPES allow-list
  * validateFile() — checks size + MIME/extension
  * uploadFile() — XHR-based POST to the unsigned upload endpoint, fires progress callbacks, parses secure_url + public_id
  * formatBytes() helper
  * UploadedFile and UploadProgress interfaces exported
- Patched HomeView.tsx SubmitProjectSection:
  * Added uploads + uploadProgress + dragOver state
  * Submissions now persist an `attachments: UploadedFile[]` field
  * New FileDropzone component (drag-and-drop + click to browse, accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.zip,.doc,.docx")
  * Per-file progress bar with XHR upload progress (0–100%)
  * Submit button disabled while uploads are in-flight; shows "Uploading files…" state
  * Success summary now lists attachments as clickable links with file icons + size
  * Reset clears uploads + progress too
  * Acceptance hint: "PNG, JPG, GIF, WebP, PDF, ZIP, DOC, DOCX — up to 25 MB each, max 5 files."
- UI mentions only "Click to attach or drag & drop" and "Files are uploaded securely" — no vendor name anywhere.
- Fixed duplicate Loader2 import, missing closing backticks on two className template literals (caught by tsc).
- Restarted dev server to load .env.local. Verified: `npx tsc --noEmit` clean for project source; `curl localhost:3000` returns 200.

Stage Summary:
- Clients can now attach up to 5 files (PNG/JPG/GIF/WebP/PDF/ZIP/DOC/DOCX, 25 MB each) when submitting a project.
- Files upload directly to the configured account via unsigned preset, with live progress bars per file.
- Attachments are stored on the submission record (localStorage now, Firestore later) and shown as clickable links in the success summary.
- Vendor name is intentionally absent from all UI strings.
- If env vars are missing, the dropzone shows "(disabled — ask admin to configure uploads)" and the submit handler shows a friendly error instead of trying to upload.

---
Task ID: contact-info-update+user-management-CRUD
Agent: main
Task: Update contact info (phone 0741622795, email akashperera464@gmail.com). Add a User Management section in the SuperAdmin panel with full CRUD — superadmin (Akash) cannot be deleted, but can add/edit/delete any other admin. Required fields: name, job field (select), username, password. Optional: mobile.

Work Log:
- HomeView.tsx: Updated mailto link, footer email, and footer phone to the new contact info.
- demo.ts: Updated SiteConfig.contactEmail to akashperera464@gmail.com.
- demo.ts: Extended TeamMember interface with optional jobField, mobile, username. Updated DEMO_TEAM seed to include Akash Perera as the superadmin (uid u_001) with his real contact info; other demo admins got jobField + username.
- SuperAdminView.tsx: Added lucide imports — Phone, Briefcase, AtSign, Pencil, X.
- SuperAdminView.tsx: Renamed sidebar entry from "Team Admins" to "User Management".
- SuperAdminView.tsx: Completely replaced the old TeamPanel with a new full-CRUD version:
  * Persists team to localStorage under "theshield_team" key (survives reloads).
  * SEED_SUPERADMIN constant guarantees Akash's superadmin row always exists.
  * SUPERADMIN_UID = "u_001" — the protected row that can never be deleted.
  * AdminFormState carries name, email, username, password, mobile, jobField.
  * JOB_FIELDS dropdown covers all 13 service categories from the website.
  * validate() — checks required fields, email format, password length (≥6 chars), and uniqueness of email/username across the team.
  * handleSubmit() — branches on editingUid: UPDATE maps over team and patches the matching row; CREATE prepends a new admin row. Superadmin role is always locked.
  * startEdit() — populates form from existing row, blanks password (leave blank to keep), smooth-scrolls to top.
  * handleDelete() — two-click confirmation pattern. Refuses to delete protected superadmin (shows error). Shows inline "Remove X? This cannot be undone" confirm banner.
  * AdminField helper component (renamed to avoid collision with existing CMS Field) wraps a label + required asterisk + children.
  * Roster card shows avatar, name, role badge, "you" pill for superadmin, and lines for email / username / jobField / mobile. Edit + trash buttons on the right. Protected superadmin's trash button is disabled with tooltip "Superadmin cannot be deleted".
- SuperAdminView.tsx: Renamed local Field component to AdminField to avoid duplicate identifier with the existing Field used in CMSPanel.
- Verified `npx tsc --noEmit` clean for project source; dev server returns 200 on :3000 and :81.

Stage Summary:
- Contact info swapped everywhere on the public site (footer + mailto + demo config).
- SuperAdmin → User Management tab now has:
  • Add form with name, email, username, password, mobile (optional), job field (select) — all validated.
  • Edit mode reuses the same form with password shown as "leave blank to keep".
  • Delete with two-click confirmation, blocked for the superadmin row.
  • Roster persists to localStorage so added/edited/removed admins survive reloads.
  • Superadmin (Akash Perera, uid u_001) is locked — cannot be deleted, role cannot be changed, but profile fields (name/email/mobile/jobField) can still be edited.

---
Task ID: project-showcase-section+admin-crud
Agent: main
Task: Add an "Our Projects" section to the homepage that displays project cards with images. Each card must be editable from the SuperAdmin panel — admin pastes Cloudinary image URL + project URL, and clicking the card on the public site opens the project.

Work Log:
- /home/z/my-project/src/data/demo.ts: Added ShowcaseProject interface (id, title, category, description, imageUrl, projectUrl, tags[], featured, order). Added SHOWCASE_CATEGORIES list (9 categories). Seeded DEMO_SHOWCASE with 6 demo projects.
- /home/z/my-project/src/lib/showcase.ts: New shared helper — loadShowcase() reads from localStorage (falls back to DEMO_SHOWCASE), saveShowcase() writes, newShowcaseId() generates sp_xxxxxx IDs. Used by both HomeView (read) and SuperAdminView (CRUD).
- HomeView.tsx: Added loadShowcase + ShowcaseProject imports. Added useState for showcase + useEffect that loads on mount. Added new lucide imports (ArrowUpRight, ExternalLink, FolderKanban).
- HomeView.tsx: New ShowcaseSection component — section id="projects", heading "Work we're proud of", 3-col responsive grid. Sorts by featured-first then order.
- HomeView.tsx: New ShowcaseCard component — 16:10 image with hover-zoom, gradient overlay, category chip, "Featured" star badge, hover-revealed external link button, title, 3-line description, tag chips, "View project" link. Card is wrapped in <a> when projectUrl is set (opens new tab), otherwise a plain div. Falls back gracefully when image/project URL is missing.
- HomeView.tsx: Inserted <ShowcaseSection projects={showcase} /> between TESTIMONIALS and SubmitProjectSection.
- SuperAdminView.tsx: Added new lucide imports (FolderKanban, ExternalLink, Star, ArrowUp, ArrowDown, Tag). Added ShowcaseProject + SHOWCASE_CATEGORIES imports. Added loadShowcase, saveShowcase, newShowcaseId imports.
- SuperAdminView.tsx: Added "projects" entry to SIDEBAR_NAV (FolderKanban icon, "Projects" label). Extended TabId union. Updated isActive check to handle projects tab. Updated content router to render ShowcasePanel when tab === "projects".
- SuperAdminView.tsx: Updated quick stats row — replaced "CMS Drafts" with "Showcase Projects" count (reads from loadShowcase()).
- SuperAdminView.tsx: New ShowcasePanel component (full CRUD):
  * Form fields: title, category (select), tags (comma-separated), description, image URL (with live preview thumbnail), project URL (with "Test link" shortcut), featured checkbox.
  * validate() — checks required fields + URL format for both imageUrl and projectUrl.
  * handleSubmit — branches on editingId for create vs update.
  * startEdit — pre-fills form, scrolls to top.
  * handleDelete — two-click confirmation pattern.
  * toggleFeatured — quick star toggle from roster.
  * move(p, ±1) — reorders via order field swap.
  * Roster shows thumbnail, title, featured badge, category, live link, 2-line description, and action buttons (star, up, down, edit, delete).
  * Persists to localStorage (same key HomeView reads from) so changes are reflected on the public homepage instantly.
- Verified `npx tsc --noEmit` clean for project source; dev server returns 200 on :3000 and :81.

Stage Summary:
- Homepage now has an "Our Projects" section showing portfolio cards with images, category chips, tags, and clickable links to live projects.
- SuperAdmin → Projects tab provides full CRUD:
  • Add new project (title, category, tags, description, image URL with live preview, project URL with test link, featured flag).
  • Edit existing project (same form, pre-filled).
  • Delete with two-click confirmation.
  • Quick-toggle featured star from roster.
  • Reorder with up/down arrows.
  • Image URL and project URL are paste-only (admin uses Cloudinary dashboard URL).
- Changes persist to localStorage and appear instantly on the public homepage (same browser session). Firestore wiring lands later for cross-device sync.
- 6 demo projects pre-seeded so the section looks populated on first load.
