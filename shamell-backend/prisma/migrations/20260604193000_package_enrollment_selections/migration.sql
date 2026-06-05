-- Align DB with Prisma: selections snapshot for package/bundle checkouts.
ALTER TABLE "upcoming_class_package_enrollments"
  ADD COLUMN IF NOT EXISTS "selections" JSONB NOT NULL DEFAULT '[]'::jsonb;
