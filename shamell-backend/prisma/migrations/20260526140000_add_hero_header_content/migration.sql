-- CreateTable
CREATE TABLE "hero_header_content" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'SHAMELL',
    "headlineFont" TEXT NOT NULL DEFAULT 'brand',
    "headlineColor" TEXT NOT NULL DEFAULT '#c5a55a',
    "tagline" TEXT NOT NULL DEFAULT 'Exclusive Belly Dance Performance Artistry',
    "taglineFont" TEXT NOT NULL DEFAULT 'elegant',
    "taglineColor" TEXT NOT NULL DEFAULT '#f5e6b8',
    "quote" TEXT NOT NULL DEFAULT 'Dance is the hidden language of the soul.',
    "quoteFont" TEXT NOT NULL DEFAULT 'script',
    "quoteColor" TEXT NOT NULL DEFAULT '#c5a55a',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_header_content_pkey" PRIMARY KEY ("id")
);

-- Seed initial row with current hero defaults
INSERT INTO "hero_header_content" (
    "id",
    "headline",
    "headlineFont",
    "headlineColor",
    "tagline",
    "taglineFont",
    "taglineColor",
    "quote",
    "quoteFont",
    "quoteColor",
    "isActive",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'SHAMELL',
    'brand',
    '#c5a55a',
    'Exclusive Belly Dance Performance Artistry',
    'elegant',
    '#f5e6b8',
    'Dance is the hidden language of the soul.',
    'script',
    '#c5a55a',
    true,
    CURRENT_TIMESTAMP
);
