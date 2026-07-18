import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_CONFIG } from '@/data/demo';

// Always-on default — used both for seeding and as a fallback if the DB is unreachable.
const DEFAULT_CONFIG = {
  id: 'global',
  ...DEMO_CONFIG,
  updatedAt: new Date().toISOString(),
};

/**
 * GET /api/config
 * Returns the single global SiteConfig document.
 * Seeds it on first call if it doesn't exist yet.
 */
export async function GET() {
  try {
    let doc = await db.siteConfig.findUnique({ where: { id: 'global' } });
    if (!doc) {
      // First-time seed
      doc = await db.siteConfig.create({ data: DEFAULT_CONFIG });
    }
    return NextResponse.json(doc);
  } catch (err) {
    console.error('[GET /api/config] error:', err);
    // Degrade gracefully — return defaults so the site still renders.
    return NextResponse.json(DEFAULT_CONFIG, { status: 200 });
  }
}

/**
 * PUT /api/config
 * Replaces the global site config with the body. Body must match SiteConfig shape.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      heroTitle,
      heroSubtitle,
      aboutText,
      contactEmail,
      logoUrl,
      mainBgUrl,
    } = body;

    if (typeof heroTitle !== 'string' || !heroTitle.trim()) {
      return NextResponse.json({ error: 'heroTitle is required' }, { status: 400 });
    }
    if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'A valid contactEmail is required' }, { status: 400 });
    }

    const data = {
      heroTitle: heroTitle.trim(),
      heroSubtitle: (heroSubtitle || '').trim(),
      aboutText: (aboutText || '').trim(),
      contactEmail: contactEmail.trim(),
      logoUrl: (logoUrl || '').trim(),
      mainBgUrl: (mainBgUrl || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    // Upsert — creates if missing, replaces if present (single global doc by id="global")
    const updated = await db.siteConfig.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/config] error:', err);
    return NextResponse.json(
      { error: 'Failed to save site config.' },
      { status: 500 }
    );
  }
}
