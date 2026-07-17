
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
