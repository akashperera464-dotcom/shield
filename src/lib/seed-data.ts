// Seed data — used by /api/seed to populate MongoDB on first deployment.
// Mirrors the original DEMO_PROJECTS / DEMO_TEAM / DEMO_SHOWCASE constants.
// Kept server-side so the client bundle doesn't ship demo data.

import type { ProjectNote } from "@/data/demo"

export interface SeedSubmission {
  id: string
  name: string
  email: string
  company: string
  service: string
  timeline: string
  brief: string
  attachments: { name: string; url: string; size?: number; type?: string }[]
  status: "Pending" | "In Progress" | "Under Review" | "Completed"
  createdAt: string
  notes?: ProjectNote[]
}

export const SEED_SUBMISSIONS: SeedSubmission[] = [
  {
    id: "p_001",
    name: "Sara Al-Mansoori",
    email: "sara@laylacosmetics.com",
    company: "Layla Cosmetics",
    service: "Website Development",
    timeline: "",
    brief:
      "Layla Cosmetics — D2C Storefront. Headless Shopify React storefront with subscription checkout, AR try-on, and a superadmin CMS for product drops.",
    attachments: [
      { name: "wireframe-home.png", url: "https://example.com/wireframe-home.png" },
      { name: "checkout-flow.pdf", url: "https://example.com/checkout-flow.pdf" },
      { name: "brand-guide.fig", url: "https://example.com/brand-guide.fig" },
    ],
    status: "In Progress",
    notes: [
      { author: "Daniel O.", text: "Sprint 1 demo scheduled for Friday.", createdAt: "2026-07-12" },
      { author: "Mei T.", text: "Logo and hero background wired up via Cloudinary URLs.", createdAt: "2026-07-14" },
    ],
    createdAt: "2026-07-10T00:00:00.000Z",
  },
  {
    id: "p_002",
    name: "Daniel Okafor",
    email: "daniel@fleetiq.io",
    company: "FleetIQ",
    service: "Software Development",
    timeline: "",
    brief:
      "FleetIQ — Operations Dashboard. Real-time fleet tracking dashboard with role-based access for ops, drivers, and finance. WebSocket live updates.",
    attachments: [{ name: "ops-screen.png", url: "https://example.com/ops-screen.png" }],
    status: "Pending",
    notes: [{ author: "Sara A.", text: "Discovery call booked for Monday.", createdAt: "2026-07-15" }],
    createdAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "p_003",
    name: "Mei Tanaka",
    email: "mei@studiomei.jp",
    company: "Studio Mei",
    service: "UI / UX Designing",
    timeline: "",
    brief:
      "Studio Mei — Portfolio + Booking. Bilingual portfolio site with Calendly-style booking, Stripe deposits, and role-based admin CMS.",
    attachments: [
      { name: "mei-wireframes.pdf", url: "https://example.com/mei-wireframes.pdf" },
      { name: "mood-board.png", url: "https://example.com/mood-board.png" },
    ],
    status: "Under Review",
    notes: [
      { author: "Daniel O.", text: "Design review pending — fonts need licensing check.", createdAt: "2026-07-14" },
      { author: "Mei T.", text: "Sent over the brand kit. Awaiting feedback.", createdAt: "2026-07-15" },
    ],
    createdAt: "2026-07-08T00:00:00.000Z",
  },
]

export interface SeedFeedback {
  id: string
  name: string
  role: string
  rating: number
  quote: string
  variant: "mint" | "violet" | "purple"
  status: "pending" | "approved" | "rejected"
  featured: boolean
  createdAt: string
  source: "seed" | "client"
}

const now = Date.now()
const days = (n: number) => new Date(now - n * 86400000).toISOString()

export const SEED_FEEDBACK: SeedFeedback[] = [
  {
    id: "fb_seed_1",
    name: "Sara Al-Mansoori",
    role: "CEO, Layla Cosmetics",
    rating: 5,
    quote:
      "The Shield took our Figma mess and shipped a polished React app in 5 weeks. The dashboard alone saved my team 12 hours a week.",
    variant: "mint",
    status: "approved",
    featured: true,
    createdAt: days(14),
    source: "seed",
  },
  {
    id: "fb_seed_2",
    name: "Daniel Okafor",
    role: "COO, FleetIQ",
    rating: 5,
    quote:
      "The role-based admin panel is exactly what we needed. Superadmin can edit copy live, my ops team manages submissions — perfect.",
    variant: "violet",
    status: "approved",
    featured: false,
    createdAt: days(21),
    source: "seed",
  },
  {
    id: "fb_seed_3",
    name: "Mei Tanaka",
    role: "Founder, Studio Mei",
    rating: 5,
    quote:
      "Submission was friction-free — one quick form and we got a clear scope back within 48 hours. The whole process felt senior.",
    variant: "purple",
    status: "approved",
    featured: false,
    createdAt: days(30),
    source: "seed",
  },
]

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png"

export interface SeedShowcase {
  id: string
  title: string
  category: string
  description: string
  imageUrl: string
  projectUrl: string
  tags: string[]
  featured: boolean
  order: number
}

export const SEED_SHOWCASE: SeedShowcase[] = [
  {
    id: "sp_001",
    title: "Layla Cosmetics — D2C Storefront",
    category: "Ecommerce",
    description:
      "Headless Shopify React storefront with subscription checkout, AR try-on, and a superadmin CMS for product drops.",
    imageUrl: LOGO_URL,
    projectUrl: "https://layla.example.com",
    tags: ["Next.js", "Shopify", "AR"],
    featured: true,
    order: 1,
  },
  {
    id: "sp_002",
    title: "FleetIQ — Operations Dashboard",
    category: "Web Development",
    description:
      "Real-time fleet tracking dashboard with role-based access for ops, drivers, and finance. WebSocket live updates.",
    imageUrl: LOGO_URL,
    projectUrl: "https://fleetiq.example.com",
    tags: ["React", "WebSocket", "Charts"],
    featured: true,
    order: 2,
  },
  {
    id: "sp_003",
    title: "Studio Mei — Portfolio + Booking",
    category: "UI / UX Design",
    description: "Bilingual portfolio site with Calendly-style booking, Stripe deposits, and role-based admin CMS.",
    imageUrl: LOGO_URL,
    projectUrl: "https://studiomei.example.com",
    tags: ["Next.js", "Stripe", "i18n"],
    featured: false,
    order: 3,
  },
  {
    id: "sp_004",
    title: "BrightPath — LMS Mobile Web",
    category: "Mobile App",
    description: "PWA learning management system with offline video, quiz engine, and parent dashboard.",
    imageUrl: LOGO_URL,
    projectUrl: "https://brightpath.example.com",
    tags: ["PWA", "Offline", "Video"],
    featured: false,
    order: 4,
  },
  {
    id: "sp_005",
    title: "Northwind — Brand Identity",
    category: "Graphic Design",
    description:
      "Complete brand identity system — logo, colour palette, typography, and brand guidelines for an internal portal.",
    imageUrl: LOGO_URL,
    projectUrl: "https://northwind.example.com",
    tags: ["Branding", "Logo", "Identity"],
    featured: false,
    order: 5,
  },
  {
    id: "sp_006",
    title: "Northwind — Internal Admin Portal",
    category: "Software Development",
    description: "Replace legacy PHP admin with a React + Firebase portal. RBAC, audit logs, CSV imports.",
    imageUrl: LOGO_URL,
    projectUrl: "https://northwind-portal.example.com",
    tags: ["React", "Firebase", "RBAC"],
    featured: false,
    order: 6,
  },
]

export interface SeedTeamMember {
  uid: string
  name: string
  email: string
  role: "superadmin" | "admin"
  createdAt: string
  jobField?: string
  mobile?: string
  username?: string
}

export const SEED_TEAM: SeedTeamMember[] = [
  {
    uid: "u_001",
    name: "Akash Perera",
    email: "akashperera@shield.com",
    role: "superadmin",
    createdAt: "2026-06-01",
    jobField: "Management",
    mobile: "0741622795",
    username: "akashperera",
  },
  {
    uid: "u_002",
    name: "Daniel Okafor",
    email: "daniel@theshield.agency",
    role: "admin",
    createdAt: "2026-06-12",
    jobField: "Software Development",
    mobile: "",
    username: "daniel",
  },
  {
    uid: "u_003",
    name: "Mei Tanaka",
    email: "mei@theshield.agency",
    role: "admin",
    createdAt: "2026-06-20",
    jobField: "Graphic Design",
    mobile: "",
    username: "mei",
  },
  {
    uid: "u_004",
    name: "Sara Al-Mansoori",
    email: "sara@theshield.agency",
    role: "admin",
    createdAt: "2026-07-01",
    jobField: "UI / UX Designing",
    mobile: "",
    username: "sara",
  },
]
