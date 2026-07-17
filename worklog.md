
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
