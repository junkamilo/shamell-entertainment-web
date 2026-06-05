-- Repair: 20260609120000 was marked applied but parts of the schema are missing.

CREATE TABLE IF NOT EXISTS "reservation_event_class_sections" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "label" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultCapacity" INTEGER NOT NULL DEFAULT 20,
    "defaultPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservation_event_class_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reservation_event_class_sections_templateId_weekday_sortOrder_key"
    ON "reservation_event_class_sections"("templateId", "weekday", "sortOrder");
CREATE INDEX IF NOT EXISTS "reservation_event_class_sections_templateId_weekday_idx"
    ON "reservation_event_class_sections"("templateId", "weekday");

DO $$ BEGIN
  ALTER TABLE "reservation_event_class_sections"
    ADD CONSTRAINT "reservation_event_class_sections_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "reservation_event_templates"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "upcoming_class_sessions" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "upcoming_class_sessions" ADD COLUMN IF NOT EXISTS "weekday" INTEGER;

DO $$ BEGIN
  ALTER TABLE "upcoming_class_sessions"
    ADD CONSTRAINT "upcoming_class_sessions_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "reservation_event_class_sections"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "upcoming_class_sessions_eventId_sectionId_startsAt_key"
    ON "upcoming_class_sessions"("eventId", "sectionId", "startsAt");
CREATE INDEX IF NOT EXISTS "upcoming_class_sessions_eventId_weekday_startsAt_idx"
    ON "upcoming_class_sessions"("eventId", "weekday", "startsAt");

ALTER TABLE "upcoming_venue_configs" ADD COLUMN IF NOT EXISTS "classPackageEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "upcoming_venue_configs" ADD COLUMN IF NOT EXISTS "classPackagePrice" DECIMAL(12,2);
ALTER TABLE "upcoming_venue_configs" ADD COLUMN IF NOT EXISTS "classPackageLabel" TEXT;

CREATE TABLE IF NOT EXISTS "upcoming_class_package_enrollments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "UpcomingClassEnrollmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "paymentMethodType" TEXT,
    "paymentMethodBrand" TEXT,
    "paymentMethodLast4" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "upcoming_class_package_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "upcoming_class_package_enrollments_stripeCheckoutSessionId_key"
    ON "upcoming_class_package_enrollments"("stripeCheckoutSessionId");
CREATE INDEX IF NOT EXISTS "upcoming_class_package_enrollments_eventId_status_idx"
    ON "upcoming_class_package_enrollments"("eventId", "status");

DO $$ BEGIN
  ALTER TABLE "upcoming_class_package_enrollments"
    ADD CONSTRAINT "upcoming_class_package_enrollments_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "upcoming_class_package_enrollment_items" (
    "id" TEXT NOT NULL,
    "packageEnrollmentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    CONSTRAINT "upcoming_class_package_enrollment_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "upcoming_class_package_enrollment_items_enrollmentId_key"
    ON "upcoming_class_package_enrollment_items"("enrollmentId");
CREATE INDEX IF NOT EXISTS "upcoming_class_package_enrollment_items_packageEnrollmentId_idx"
    ON "upcoming_class_package_enrollment_items"("packageEnrollmentId");

DO $$ BEGIN
  ALTER TABLE "upcoming_class_package_enrollment_items"
    ADD CONSTRAINT "upcoming_class_package_enrollment_items_packageEnrollmentId_fkey"
    FOREIGN KEY ("packageEnrollmentId") REFERENCES "upcoming_class_package_enrollments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "upcoming_class_package_enrollment_items"
    ADD CONSTRAINT "upcoming_class_package_enrollment_items_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "upcoming_class_enrollments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "upcoming_class_enrollments"
    ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;

INSERT INTO "reservation_event_class_sections" (
    "id", "templateId", "weekday", "label", "startTime", "endTime",
    "sortOrder", "defaultCapacity", "isActive", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    t."id",
    w."weekday",
    'Section 1',
    COALESCE(t."recurringStartTime", '10:00'),
    COALESCE(t."recurringEndTime", '12:00'),
    0,
    20,
    true,
    CURRENT_TIMESTAMP
FROM "reservation_event_templates" t
JOIN "reservation_event_weekdays" w ON w."templateId" = t."id"
WHERE t."scheduleMode" = 'RECURRING_WEEKLY'
  AND w."isActive" = true
  AND NOT EXISTS (
    SELECT 1 FROM "reservation_event_class_sections" s
    WHERE s."templateId" = t."id" AND s."weekday" = w."weekday"
  );
