// Demo mock data — used until Firebase credentials are provided.

export interface ProjectNote {
  author: string;
  text: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  description: string;
  budget: string;
  status: "Pending" | "In Progress" | "Under Review" | "Completed";
  attachments: string[];
  notes: ProjectNote[];
  createdAt: string;
}

export const DEMO_PROJECTS: Project[] = [
  {
    id: "p_001",
    clientName: "Sara Al-Mansoori",
    clientEmail: "sara@laylacosmetics.com",
    projectTitle: "Layla Cosmetics — D2C Storefront",
    description:
      "Headless Shopify React storefront with subscription checkout, AR try-on, and a superadmin CMS for product drops.",
    budget: "$25k – $40k",
    status: "In Progress",
    attachments: ["wireframe-home.png", "checkout-flow.pdf", "brand-guide.fig"],
    notes: [
      { author: "Daniel O.", text: "Sprint 1 demo scheduled for Friday.", createdAt: "2026-07-12" },
      { author: "Mei T.", text: "Logo and hero background wired up via Cloudinary URLs.", createdAt: "2026-07-14" },
    ],
    createdAt: "2026-07-10",
  },
  {
    id: "p_002",
    clientName: "Daniel Okafor",
    clientEmail: "daniel@fleetiq.io",
    projectTitle: "FleetIQ — Operations Dashboard",
    description:
      "Real-time fleet tracking dashboard with role-based access for ops, drivers, and finance. WebSocket live updates.",
    budget: "$40k – $60k",
    status: "Pending",
    attachments: ["ops-screen.png"],
    notes: [
      { author: "Sara A.", text: "Discovery call booked for Monday.", createdAt: "2026-07-15" },
    ],
    createdAt: "2026-07-15",
  },
  {
    id: "p_003",
    clientName: "Mei Tanaka",
    clientEmail: "mei@studiomei.jp",
    projectTitle: "Studio Mei — Portfolio + Booking",
    description:
      "Bilingual portfolio site with Calendly-style booking, Stripe deposits, and role-based admin CMS.",
    budget: "$8k – $15k",
    status: "Under Review",
    attachments: ["mei-wireframes.pdf", "mood-board.png", "logo.svg"],
    notes: [
      { author: "Daniel O.", text: "Design review pending — fonts need licensing check.", createdAt: "2026-07-14" },
      { author: "Mei T.", text: "Sent over the brand kit. Awaiting feedback.", createdAt: "2026-07-15" },
    ],
    createdAt: "2026-07-08",
  },
  {
    id: "p_004",
    clientName: "Alex Petrov",
    clientEmail: "alex@northwind.dev",
    projectTitle: "Northwind — Internal Admin Portal",
    description:
      "Replace legacy PHP admin with a React + Firebase portal. RBAC, audit logs, CSV imports.",
    budget: "$30k – $50k",
    status: "Completed",
    attachments: ["legacy-screens.zip"],
    notes: [
      { author: "Sara A.", text: "Shipped to production. Handoff docs delivered.", createdAt: "2026-07-02" },
    ],
    createdAt: "2026-05-20",
  },
  {
    id: "p_005",
    clientName: "Priya Nair",
    clientEmail: "priya@brightpath.edu",
    projectTitle: "BrightPath — LMS Mobile Web",
    description:
      "PWA learning management system with offline video, quiz engine, and parent dashboard.",
    budget: "$50k – $80k",
    status: "In Progress",
    attachments: ["pwa-spec.pdf", "quiz-flow.png"],
    notes: [
      { author: "Daniel O.", text: "Sprint 2 — quiz engine 80% complete.", createdAt: "2026-07-16" },
    ],
    createdAt: "2026-06-28",
  },
];

export interface TeamMember {
  uid: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  createdAt: string;
}

export const DEMO_TEAM: TeamMember[] = [
  { uid: "u_001", name: "You (Superadmin)", email: "superadmin@demo.theshield", role: "superadmin", createdAt: "2026-06-01" },
  { uid: "u_002", name: "Daniel Okafor",    email: "daniel@theshield.agency",      role: "admin",      createdAt: "2026-06-12" },
  { uid: "u_003", name: "Mei Tanaka",       email: "mei@theshield.agency",         role: "admin",      createdAt: "2026-06-20" },
  { uid: "u_004", name: "Sara Al-Mansoori", email: "sara@theshield.agency",        role: "admin",      createdAt: "2026-07-01" },
];

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  logoUrl: string;
  mainBgUrl: string;
}

export const DEMO_CONFIG: SiteConfig = {
  heroTitle: "Application Development",
  heroSubtitle: "Bridging the gap between business and technology.",
  aboutText:
    "The Shield bridges the gap between business and technology. We design, build, and ship production software across every technology domain.",
  contactEmail: "hello@theshield.agency",
  logoUrl:
    "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png",
  mainBgUrl:
    "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png",
};

export const STATUSES = ["Pending", "In Progress", "Under Review", "Completed"] as const;

export const STATUS_CLASS: Record<Project["status"], string> = {
  Pending: "badge-pending",
  "In Progress": "badge-progress",
  "Under Review": "badge-review",
  Completed: "badge-completed",
};
