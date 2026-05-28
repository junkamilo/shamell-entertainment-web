-- Upcoming Events hub: experience types, venue config per event, class sessions, multi-event seating.

CREATE TYPE "UpcomingExperienceType" AS ENUM ('CLASSES', 'VENUE_SEATING');
CREATE TYPE "UpcomingClassVariant" AS ENUM ('GROUP', 'PERSONAL');
CREATE TYPE "UpcomingClassEnrollmentStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED');

ALTER TABLE "events"
ADD COLUMN "slug" TEXT,
ADD COLUMN "experienceType" "UpcomingExperienceType",
ADD COLUMN "classVariant" "UpcomingClassVariant";

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

CREATE TABLE "upcoming_venue_configs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientEnabled" BOOLEAN NOT NULL DEFAULT false,
    "promoTitle" TEXT,
    "promoDescription" TEXT,
    "promoImageUrl" TEXT,
    "promoImagePublicId" TEXT,
    "reservationEventDate" TIMESTAMP(3),
    "reservationOpensAt" TIMESTAMP(3),
    "reservationClosesAt" TIMESTAMP(3),
    "reservationEventLabel" TEXT,
    "reservationTimezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "floorLayoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_venue_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "upcoming_venue_configs_eventId_key" ON "upcoming_venue_configs"("eventId");

ALTER TABLE "upcoming_venue_configs"
ADD CONSTRAINT "upcoming_venue_configs_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "upcoming_venue_configs"
ADD CONSTRAINT "upcoming_venue_configs_floorLayoutId_fkey"
FOREIGN KEY ("floorLayoutId") REFERENCES "venue_floor_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "upcoming_class_sessions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_class_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "upcoming_class_sessions_eventId_startsAt_idx" ON "upcoming_class_sessions"("eventId", "startsAt");

ALTER TABLE "upcoming_class_sessions"
ADD CONSTRAINT "upcoming_class_sessions_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "upcoming_class_enrollments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "UpcomingClassEnrollmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_class_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "upcoming_class_enrollments_stripeCheckoutSessionId_key" ON "upcoming_class_enrollments"("stripeCheckoutSessionId");
CREATE INDEX "upcoming_class_enrollments_sessionId_status_idx" ON "upcoming_class_enrollments"("sessionId", "status");

ALTER TABLE "upcoming_class_enrollments"
ADD CONSTRAINT "upcoming_class_enrollments_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "upcoming_class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "venue_seat_reservations" ADD COLUMN "upcomingEventId" TEXT;

ALTER TABLE "venue_seat_reservations"
ADD CONSTRAINT "venue_seat_reservations_upcomingEventId_fkey"
FOREIGN KEY ("upcomingEventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "venue_seat_reservations_venueTableConfigId_eventDate_key";

CREATE UNIQUE INDEX "venue_seat_reservations_layoutItemId_upcomingEventId_key"
ON "venue_seat_reservations"("layoutItemId", "upcomingEventId");

CREATE INDEX "venue_seat_reservations_layoutItemId_upcomingEventId_status_idx"
ON "venue_seat_reservations"("layoutItemId", "upcomingEventId", "status");

CREATE INDEX "venue_seat_reservations_upcomingEventId_status_idx"
ON "venue_seat_reservations"("upcomingEventId", "status");

DROP INDEX IF EXISTS "venue_seat_reservations_layoutItemId_eventDate_status_idx";

-- Backfill slugs for upcoming events (lowercase, hyphenated name + short id suffix for uniqueness).
UPDATE "events" e
SET
  "slug" = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(COALESCE(et."name", 'event'), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    )
  ) || '-' || SUBSTRING(e."id" FROM 1 FOR 8),
  "experienceType" = 'CLASSES'
FROM "event_types" et
WHERE e."eventTypeId" = et."id"
  AND e."publicSection" = 'UPCOMING_EVENTS'
  AND e."slug" IS NULL;

-- Promote first upcoming to VENUE_SEATING if singleton settings exist (legacy escenario).
UPDATE "events" e
SET "experienceType" = 'VENUE_SEATING'
WHERE e."publicSection" = 'UPCOMING_EVENTS'
  AND e."id" = (
    SELECT e2."id"
    FROM "events" e2
    WHERE e2."publicSection" = 'UPCOMING_EVENTS'
    ORDER BY e2."createdAt" ASC
    LIMIT 1
  )
  AND EXISTS (SELECT 1 FROM "venue_layout_client_settings" LIMIT 1);

-- Migrate singleton venue settings to UpcomingVenueConfig for the VENUE_SEATING upcoming event.
INSERT INTO "upcoming_venue_configs" (
  "id",
  "eventId",
  "clientEnabled",
  "promoTitle",
  "promoDescription",
  "promoImageUrl",
  "promoImagePublicId",
  "reservationEventDate",
  "reservationOpensAt",
  "reservationClosesAt",
  "reservationEventLabel",
  "reservationTimezone",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  e."id",
  COALESCE(s."clientEnabled", false),
  s."promoTitle",
  s."promoDescription",
  s."promoImageUrl",
  s."promoImagePublicId",
  s."reservationEventDate",
  s."reservationOpensAt",
  s."reservationClosesAt",
  s."reservationEventLabel",
  COALESCE(s."reservationTimezone", 'America/New_York'),
  NOW()
FROM "events" e
CROSS JOIN LATERAL (
  SELECT * FROM "venue_layout_client_settings" ORDER BY "updatedAt" DESC LIMIT 1
) s
WHERE e."publicSection" = 'UPCOMING_EVENTS'
  AND e."experienceType" = 'VENUE_SEATING'
  AND NOT EXISTS (
    SELECT 1 FROM "upcoming_venue_configs" u WHERE u."eventId" = e."id"
  )
LIMIT 1;

-- Backfill seat reservations to the primary venue upcoming event.
UPDATE "venue_seat_reservations" r
SET "upcomingEventId" = (
  SELECT e."id"
  FROM "events" e
  WHERE e."publicSection" = 'UPCOMING_EVENTS'
    AND e."experienceType" = 'VENUE_SEATING'
  ORDER BY e."createdAt" ASC
  LIMIT 1
)
WHERE r."upcomingEventId" IS NULL;
